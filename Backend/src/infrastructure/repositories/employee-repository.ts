import EmployeeModel from "../db/models/employee.model";
import Employee from "../../domain/entities/Employee";
import EmployeeRepository from "../../domain/Repository/i-employee-repository";
import redisClient from "../../app";
import { DuplicateResourceError, ServerError } from "../../domain/error/employeeErrors";
import { EmailService } from "../Services/nodemailer-service";
import { ComplaintModel } from "../db/complaint.model";
import { inject, injectable } from "inversify";
import { TYPES } from "../../types";
import { IGetAllEmployeesUseCase } from "../../domain/dtos/Employee-usecase/get-all-employee-usecase-interface";
import { IEditEmployeeUsecase } from "../../domain/dtos/Employee-usecase/edit-employee-usecase-interface";
import { IFindAllCoordinatorAndMechanic } from "../../domain/dtos/Employee-usecase/find-all-coordinator-usecase";
import { IGetEmployeeProfileUsecase } from "../../domain/dtos/Employee-usecase/get-employee-profile-usecase-interface";
import { IGetAvailableMechanicUsecase } from "../../domain/dtos/complaint-usecase/get-available-mechanic-usecase-interface";
import { ComplaintReassignmentScheduler } from "../Services/scheduler-service";
import { ISafeEmployee } from "../../domain/dtos/Employee-usecase/safe-employee-interface";

type UnknownRecord = Record<string, unknown>;

const priorityMap: Record<string, number> = {
  high: 3,
  medium: 2,
  low: 1
};

const MAX_PENDING_COMPLAINTS = 5;

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

@injectable()
export default class EmployeeRepoImpl implements EmployeeRepository {
  private buildFieldRegex(productType: string): RegExp[] {
    const normalizedType = productType.toLowerCase().trim();
    if (!normalizedType) {
      return [/.*/];
    }

    const aliases = this.getProductTypeAliases(normalizedType);
    const regexes: RegExp[] = [];

    aliases.forEach((alias) => {
      const escapedAlias = escapeRegex(alias);
      regexes.push(new RegExp(`\\b${escapedAlias}s?\\b`, 'i'));
      regexes.push(new RegExp(`${escapedAlias}`, 'i'));
    });

    const uniqueSources = Array.from(new Set(regexes.map((regex) => regex.source)));
    return uniqueSources.map((source) => new RegExp(source, 'i'));
  }

  private getProductTypeAliases(productType: string): string[] {
    const normalized = productType.toLowerCase().trim();
    const aliases = new Set<string>();
    aliases.add(normalized);

    if (normalized.includes('invert')) {
      aliases.add('inverter');
      aliases.add('invertor');
    }

    if (normalized.includes('battery')) {
      aliases.add('battery');
    }

    if (normalized.includes('solar')) {
      aliases.add('solar');
    }

    return Array.from(aliases);
  }
  constructor(
    @inject(TYPES.EmailService) private EmailService: EmailService,
  ) { }
  async createEmployee(
    employeeName: string,
    emailId: string,
    joinDate: Date,
    contactNumber: string,
    address: string,
    currentSalary: number,
    age: number,
    position: 'coordinator' | 'mechanic',
    fieldOfMechanic?: string[],
    previousJob: string = "",
    experience: number = 0,
    password?: string,
  ): Promise<Employee | null> {
    try {
      const employee = await EmployeeModel.create({
        employeeName,
        emailId,
        joinDate,
        contactNumber,
        address,
        currentSalary,
        age,
        position,
        previousJob,
        experience,
        fieldOfMechanic
      });

      // Send welcome email asynchronously without blocking the response
      this.EmailService.sendEmployeeWelcomeEmail(emailId, employeeName, password)
        .catch((error) => {
          console.error("Failed to send employee welcome email:", error);
          // Don't throw - email failure shouldn't prevent employee creation
        });

      return {
        id: employee._id.toString(),
        employeeName: employee.employeeName,
        emailId: employee.emailId,
        joinDate: employee.joinDate,
        contactNumber: employee.contactNumber,
        address: employee.address,
        currentSalary: employee.currentSalary,
        age: employee.age,
        position: employee.position,
        previousJob: employee.previousJob,
        experience: employee.experience,
        status: employee.status,
        isDeleted: employee.isDeleted,
        password: employee.password,
        workingStatus: employee.workingStatus,
        fieldOfMechanic: employee.fieldOfMechanic
      };
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "name" in error &&
        "code" in error &&
        (error as { name: string }).name === "MongoError" &&
        (error as { code: number }).code === 11000
      ) {
        throw new DuplicateResourceError("An employee with this email already exists");
      }
      throw error;
    }
  }


  async updateWorkingStatus(id: string, status: 'Available' | 'Occupied'): Promise<void> {
    await EmployeeModel.findByIdAndUpdate(id, { workingStatus: status });
  }

  async findBestMechanic(productType: string, priority: 'high' | 'medium' | 'low'): Promise<ISafeEmployee | null> {
    try {
      const normalizedType = productType.toLowerCase().trim();

      const fieldMatches = this.buildFieldRegex(normalizedType);
      const availableMechanics = await EmployeeModel.find({
        position: 'mechanic',
        isDeleted: false,
        status: 'active',
        workingStatus: 'Available',
        fieldOfMechanic: { $in: fieldMatches }
      }).sort({ experience: -1 });

      const mechanicsWithWorkload = await Promise.all(
        availableMechanics.map(async (mechanic) => {
          const pendingComplaints = await ComplaintModel.countDocuments({
            'assignedMechanics.mechanicId': mechanic._id,
            'status.status': { $in: ['pending', 'in-progress'] }
          });
          return { mechanic, pendingComplaints };
        })
      );

      const eligibleMechanics = mechanicsWithWorkload
        .filter(m => m.pendingComplaints < MAX_PENDING_COMPLAINTS)
        .sort((a, b) => {
          // 1. Sort by pending complaints (lowest first)
          if (a.pendingComplaints !== b.pendingComplaints) {
            return a.pendingComplaints - b.pendingComplaints;
          }
          // 2. Sort by lastAssignedAt (oldest/null first for fair distribution)
          const aTime = a.mechanic.lastAssignedAt ? new Date(a.mechanic.lastAssignedAt).getTime() : 0;
          const bTime = b.mechanic.lastAssignedAt ? new Date(b.mechanic.lastAssignedAt).getTime() : 0;
          if (aTime !== bTime) {
            return aTime - bTime;
          }
          // 3. Sort by experience (highest first - tie-breaker)
          return (b.mechanic.experience ?? 0) - (a.mechanic.experience ?? 0);
        });

      if (eligibleMechanics.length > 0) {
        const mech = eligibleMechanics[0].mechanic as unknown;
        const mechObj = (mech as { toObject?: () => unknown }).toObject?.() ?? mech;
        return this.toSafeEmployee(mechObj as any);
      }

      const busyFieldMechanics = await EmployeeModel.find({
        position: 'mechanic',
        isDeleted: false,
        status: 'active',
        fieldOfMechanic: { $in: fieldMatches }
      });

      const prioritizedBusyMechanic = await Promise.all(
        busyFieldMechanics.map(async (mechanic) => {
          const activeComplaints = await ComplaintModel.find({
            'assignedMechanics.mechanicId': mechanic._id,
            'status.status': { $ne: 'completed' }
          });

          const pendingComplaints = activeComplaints.filter(c =>
            c.status.status === 'pending' || c.status.status === 'in-progress'
          ).length;

          if (pendingComplaints >= MAX_PENDING_COMPLAINTS) {
            return null;
          }

          const totalPriority = activeComplaints.reduce((sum, comp) => {
            const prio = comp.priority?.toLowerCase?.() || 'low';
            return sum + (priorityMap[prio] || 1);
          }, 0);

          return { mechanic, totalPriority, pendingComplaints };
        })
      ).then(results => results.filter(Boolean));

      prioritizedBusyMechanic.sort(
        (a, b) => {
          if (!a || !b) return 0;
          // 1. Sort by total priority score (lowest first)
          if (a.totalPriority !== b.totalPriority) {
            return a.totalPriority - b.totalPriority;
          }
          // 2. Sort by pending complaints (lowest first)
          if (a.pendingComplaints !== b.pendingComplaints) {
            return a.pendingComplaints - b.pendingComplaints;
          }
          // 3. Sort by lastAssignedAt (oldest/null first for fair distribution)
          const aTime = a.mechanic.lastAssignedAt ? new Date(a.mechanic.lastAssignedAt).getTime() : 0;
          const bTime = b.mechanic.lastAssignedAt ? new Date(b.mechanic.lastAssignedAt).getTime() : 0;
          if (aTime !== bTime) {
            return aTime - bTime;
          }
          // 4. Sort by experience (highest first - tie-breaker)
          return ((b.mechanic.experience ?? 0) - (a.mechanic.experience ?? 0));
        }
      );

      if (prioritizedBusyMechanic.length > 0 && prioritizedBusyMechanic[0]) {
        const mech = prioritizedBusyMechanic[0].mechanic as unknown;
        const mechObj = (mech as { toObject?: () => unknown }).toObject?.() ?? mech;
        return this.toSafeEmployee(mechObj as any);
      }

      // const allAvailableMechanics = await EmployeeModel.find({
      //   position: 'mechanic',
      //   isDeleted: false,
      //   status: 'active',
      //   workingStatus: 'Available'
      // });

      // const allWithWorkload = await Promise.all(
      //   allAvailableMechanics.map(async (mechanic) => {
      //     const pendingComplaints = await ComplaintModel.countDocuments({
      //       'assignedMechanics.mechanicId': mechanic._id,
      //       'status.status': { $in: ['pending', 'in-progress'] }
      //     });
      //     return { mechanic, pendingComplaints };
      //   })
      // );

      // const eligibleFallback = allWithWorkload
      //   .filter(m => m.pendingComplaints < MAX_PENDING_COMPLAINTS)
      //   .sort((a, b) =>
      //     a.pendingComplaints - b.pendingComplaints ||
      //     ((b.mechanic.experience ?? 0) - (a.mechanic.experience ?? 0))
      //   );

      // if (eligibleFallback.length > 0) {
      //   return eligibleFallback[0].mechanic;
      // }

      return null;
    } catch (error) {
      console.error('Mechanic assignment error:', error);
      return null;
    }
  }

  async findBestMechanicExcluding(
    productType: string,
    priority: string,
    excludeMechanicId: string
  ): Promise<Employee | null> {
    const fieldMatches = this.buildFieldRegex(productType);
    const result = await EmployeeModel.findOne({
      _id: { $ne: excludeMechanicId },
      position: 'mechanic',
      isDeleted: false,
      status: 'active',
      workingStatus: 'Available',
      fieldOfMechanic: { $in: fieldMatches }
    }).sort({ experience: -1 }).lean();

    return result ? this.toDomainEntity(result) : null;
  }

  async findCoordinators() {
    return await EmployeeModel.find(
      {
        position: "coordinator",
        isDeleted: false,
        status: "active"
      },
      { emailId: 1, employeeName: 1, _id: 1 }
    );
  }

  async findAllMechanics(): Promise<IFindAllCoordinatorAndMechanic[]> {
    try {
      const mechanics = await EmployeeModel.find({
        position: 'mechanic',
        isDeleted: false
      });
      return mechanics.map(m => this.toDomainEntity(m));
    } catch (error) {
      console.error("Error finding mechanics:", error);
      throw new ServerError("Failed to retrieve mechanics");
    }
  }

  async findAllCoordinators(): Promise<IFindAllCoordinatorAndMechanic[]> {
    try {
      const coordinators = await EmployeeModel.find({
        position: 'coordinator',
        isDeleted: false
      });
      return coordinators.map(c => this.toDomainEntity(c));
    } catch (error) {
      console.error("Error finding coordinators:", error);
      throw new ServerError("Failed to retrieve coordinators");
    }
  }


  async findByEmployeeId(id: string): Promise<IGetEmployeeProfileUsecase | null> {
    try {
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return null;
      }
      const employee = await EmployeeModel.findById(id);
      if (!employee) {
        return null;
      }
      return this.toDomainEntity(employee);
    } catch (error) {
      console.error("Error finding employee by ID:", error);
      throw new ServerError("Failed to retrieve employee");
    }
  }


  private toDomainEntity(employee: any): Employee {
    return {
      id: String(employee._id),
      employeeName: String(employee.employeeName ?? ''),
      emailId: String(employee.emailId ?? ''),
      joinDate: new Date(employee.joinDate as string | Date),
      contactNumber: String(employee.contactNumber ?? ''),
      address: String(employee.address ?? ''),
      currentSalary: Number(employee.currentSalary ?? 0),
      age: Number(employee.age ?? 0),
      position: (employee.position as 'coordinator' | 'mechanic') ?? 'mechanic',
      previousJob: String(employee.previousJob ?? ''),
      experience: Number(employee.experience ?? 0),
      status: (String(employee.status ?? '') as 'active' | 'inactive'),
      isDeleted: Boolean(employee.isDeleted ?? false),
      password: String(employee.password ?? ''),
      workingStatus: (String(employee.workingStatus ?? '') as 'Available' | 'Occupied'),
      fieldOfMechanic: (employee.fieldOfMechanic as unknown) as string[]
    };
  }

  private toSafeEmployee(employee: any): ISafeEmployee {
    return {
      id: String(employee._id ?? ''),
      employeeName: String(employee.employeeName ?? ''),
      emailId: String(employee.emailId ?? ''),
      joinDate: new Date(employee.joinDate as string | Date),
      contactNumber: String(employee.contactNumber ?? ''),
      address: String(employee.address ?? ''),
      currentSalary: Number(employee.currentSalary ?? 0),
      age: Number(employee.age ?? 0),
      position: (employee.position as 'mechanic' | 'coordinator') ?? 'mechanic',
      previousJob: employee.previousJob ? String(employee.previousJob) : null,
      experience: Number(employee.experience ?? 0),
      status: String(employee.status ?? ''),
      isDeleted: Boolean(employee.isDeleted ?? false),
      workingStatus: (String(employee.workingStatus ?? '') as 'Available' | 'Occupied'),
      fieldOfMechanic: (employee.fieldOfMechanic as unknown) as string[]
    };
  }

  async findAvailableMechanics(): Promise<IGetAvailableMechanicUsecase[]> {
    const mechanics = await EmployeeModel.find({
      position: 'mechanic',
      $or: [
        { workingStatus: 'Available' },
        { workingStatus: null }
      ],
      status: 'active',
      isDeleted: false
    }).lean();
    return mechanics.map(mech => ({
      id: mech._id.toString(),
      employeeName: mech.employeeName,
      emailId: mech.emailId,
      joinDate: mech.joinDate,
      contactNumber: mech.contactNumber,
      address: mech.address,
      currentSalary: mech.currentSalary,
      age: mech.age,
      position: mech.position,
      previousJob: mech.previousJob,
      experience: mech.experience,
      status: mech.status,
      isDeleted: mech.isDeleted,
      password: mech.password,
      workingStatus: mech.workingStatus,
      fieldOfMechanic: mech.fieldOfMechanic
    }));
  }


  async getAllEmployees(page: number = 1, limit: number = 10): Promise<{ employees: IGetAllEmployeesUseCase[]; total: number }> {
    const skip = (page - 1) * limit;
    const [employees, total] = await Promise.all([
      EmployeeModel.find({ isDeleted: false })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      EmployeeModel.countDocuments({ isDeleted: false })
    ]);
    return {
      employees: employees.map(emp => ({
        id: emp._id.toString(),
        employeeName: emp.employeeName,
        emailId: emp.emailId,
        joinDate: emp.joinDate,
        contactNumber: emp.contactNumber,
        address: emp.address,
        currentSalary: emp.currentSalary,
        age: emp.age,
        position: emp.position,
        previousJob: emp.previousJob ?? null,
        experience: emp.experience ?? 0,
        status: emp.status,
        isDeleted: emp.isDeleted,
        workingStatus: emp.workingStatus,
        fieldOfMechanic: emp.fieldOfMechanic
      })),
      total
    };
  }

  async updateStatus(employeeId: string, newStatus: "active" | "inactive"): Promise<void> {
    try {
      const cleanId = employeeId.replace(/^:/, '');
      const employee = await EmployeeModel.findById(cleanId);


      if (!employee) {
        throw new Error('Employee not found');
      }

      const updatedEmployee = await EmployeeModel.findByIdAndUpdate(
        cleanId,
        { status: newStatus },
        { new: true }
      );

    } catch (error) {
      console.error('Error updating employee status:', error);
      throw error;
    }
  }

  async softDeleteEmployee(EmployeeId: string): Promise<Employee> {
    const ComplaintSafe = await ComplaintModel.findOne({
      'assignedMechanics.mechanicId': EmployeeId,
      workingStatus: 'progress'
    })

    if (ComplaintSafe) {
      throw new Error("Cannot delete employee assigned to active complaints");
    }

    const client = await EmployeeModel.findByIdAndUpdate(
      EmployeeId,
      { isDeleted: true },
      { new: true }
    );
    if (!client) throw new Error('Employee not found');
    return this.toDomainEntity(client as any);
  }

  async updateEmployee(employeeId: string, updatedData: Partial<Employee>): Promise<IEditEmployeeUsecase | null> {
    const cleanId = employeeId.replace(/^:/, '');
    const ComplaintSafe = await ComplaintModel.findOne({
      'assignedMechanics.mechanicId': cleanId,
      workingStatus: 'progress'
    })

    if (ComplaintSafe) {
      throw new Error("Cannot delete employee assigned to active complaints");
    }

    return await EmployeeModel.findByIdAndUpdate(cleanId, updatedData, { new: true });
  }
  async findByEmail(emailId: string): Promise<Employee | null> {
    const employeeDoc = await EmployeeModel.findOne({ emailId })
    if (!employeeDoc) return null;
    return {
      id: employeeDoc._id.toString(),
      employeeName: employeeDoc.employeeName,
      emailId: employeeDoc.emailId,
      joinDate: employeeDoc.joinDate,
      contactNumber: employeeDoc.contactNumber,
      address: employeeDoc.address,
      currentSalary: employeeDoc.currentSalary,
      age: employeeDoc.age,
      position: employeeDoc.position,
      previousJob: employeeDoc.previousJob,
      experience: employeeDoc.experience,
      status: employeeDoc.status,
      isDeleted: employeeDoc.isDeleted,
      password: employeeDoc.password,
      workingStatus: employeeDoc.workingStatus,
      fieldOfMechanic: employeeDoc.fieldOfMechanic
    };
  }

  async storeOTP(email: string, otp: string) {
    await redisClient.set(`otp:${email}`, otp,);
  }

  async verifyOTP(email: string, otp: string) {
    const storedOtp = await redisClient.get(`otp:${email}`);
    if (!storedOtp) throw new Error("OTP expired or not found");
    return storedOtp === otp;
  }

  async updatePassword(email: string, hashedPassword: string) {
    const res = await EmployeeModel.updateOne(
      { emailId: email }, { password: hashedPassword }
    );
  }


  async searchEmployees(
    searchTerm: string,
    status: string,
    position: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ employees: Employee[]; total: number }> {
    const skip = (page - 1) * limit;
    const query: Record<string, unknown> = { isDeleted: false };

    if (searchTerm) {
      const searchRegex = new RegExp(searchTerm, 'i');
      query.$or = [
        { employeeName: searchRegex },
        { emailId: searchRegex },
        { contactNumber: searchRegex },
        { address: searchRegex }
      ];
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (position && position !== 'all') {
      query.position = position;
    }

    const [employees, total] = await Promise.all([
      EmployeeModel.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      EmployeeModel.countDocuments(query)
    ]);

    const transformedEmployees = employees.map(emp => ({
      id: emp._id.toString(),
      employeeName: emp.employeeName,
      emailId: emp.emailId,
      joinDate: emp.joinDate,
      contactNumber: emp.contactNumber,
      address: emp.address,
      currentSalary: emp.currentSalary,
      age: emp.age,
      position: emp.position,
      previousJob: emp.previousJob,
      experience: emp.experience,
      status: emp.status,
      isDeleted: emp.isDeleted,
      password: emp.password,
      workingStatus: emp.workingStatus,
      fieldOfMechanic: emp.fieldOfMechanic
    }));
    return { employees: transformedEmployees, total };
  }

  async updateLastAssignedAt(mechanicId: string): Promise<void> {
    try {
      await EmployeeModel.findByIdAndUpdate(
        mechanicId,
        { lastAssignedAt: new Date() },
        { new: true }
      );
    } catch (error) {
      console.error('Error updating lastAssignedAt for mechanic:', mechanicId, error);
      // Non-critical operation, don't throw
    }
  }
}