import { inject, injectable } from "inversify";
import { IAddEmployeeUseCase } from "../../../../Application/interface/admin/employee/add-employee-usecase-interface";
import { IAddEmployeeDTO } from "../../../../domain/dtos/Employee-usecase/add-employee-usecase-interface";
import { TYPES } from "../../../../types";
import IEmployeeRepository from "../../../../domain/Repository/i-employee-repository";
import { ValidationError } from "../../../../domain/error/complaintError";
import { ResponseDTO } from "../../../../domain/dtos/Response";
import { StatusCode } from "../../../../shared/enums/statusCode";
import { Types } from "twilio/lib/rest/content/v1/content";

@injectable()
export class AddEmployeeUseCase implements IAddEmployeeUseCase {
  constructor(
    @inject(TYPES.IEmployeeRepository) private employeeRepo: IEmployeeRepository
  ) {}

  private validateInput(data: IAddEmployeeDTO): void {
    const { employeeName, emailId, joinDate, currentSalary, age, position, experience } = data;

    if (!employeeName?.trim()) throw new ValidationError("Employee name is required");
    if (!emailId?.trim()) throw new ValidationError("Email is required");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailId)) throw new ValidationError("Invalid email format");

    const parsedJoinDate = joinDate instanceof Date ? joinDate : new Date(joinDate);
    if (isNaN(parsedJoinDate.getTime())) throw new ValidationError("Invalid join date format");
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // If joinDate is a string (YYYY-MM-DD), parse as local date
    let dateToCompare = parsedJoinDate;
    if (typeof joinDate === 'string') {
      const [year, month, day] = joinDate.split('-').map(Number);
      dateToCompare = new Date(year, month - 1, day, 0, 0, 0, 0);
    } else {
      dateToCompare.setHours(0, 0, 0, 0);
    }
    
    if (dateToCompare > today) throw new ValidationError("Join date cannot be in the future");

    if (isNaN(currentSalary) || currentSalary <= 0) throw new ValidationError("Salary must be positive");
    if (isNaN(age) || age < 18 || age > 80) throw new ValidationError("Age must be between 18 and 80");

    if (!['coordinator', 'mechanic'].includes(position)) {
      throw new ValidationError("Position must be either 'coordinator' or 'mechanic'");
    }
    if (experience !== null && experience !== undefined) {
      if (Number.isNaN(experience) || experience < 0) {
        throw new ValidationError("Experience must be a non-negative number");
      }
    }
  }

async execute(data: IAddEmployeeDTO): Promise<ResponseDTO<IAddEmployeeDTO>> {
  try {
    this.validateInput(data);

    const existingEmployee = await this.employeeRepo.findByEmail(data.emailId);
    if (existingEmployee) {
      console.log("This email already exists");
      return { 
        success: false, 
        message: "Employee with this email already exists", 
        statusCode: StatusCode.BAD_REQUEST 
      };
    }

    const parsedJoinDate = data.joinDate instanceof Date ? data.joinDate : new Date(data.joinDate);

    const employee = await this.employeeRepo.createEmployee(
      data.employeeName,
      data.emailId,
      parsedJoinDate,
      data.contactNumber,
      data.address,
      data.currentSalary,
      data.age,
      data.position,
      data.fieldOfMechanic ?? [],
      data.previousJob || "",
      data.experience ?? 0
    );

    if (!employee) throw new Error("Employee not available");

    return {
      success: true,
      data: employee,
      message: "Employee created successfully",
      statusCode: StatusCode.CREATED,
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      return { success: false, message: error.message, statusCode: StatusCode.BAD_REQUEST };
    }
    console.error("Error in AddEmployeeUseCase:", error);
    return { success: false, message: "Failed to add employee", statusCode: StatusCode.INTERNAL_SERVER_ERROR };
  }
}
}
