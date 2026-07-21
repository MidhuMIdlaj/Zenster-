import { promises } from "dns";
import Employee from "../entities/Employee";
import { Types } from "mongoose";
import { IGetAllEmployeesUseCase } from "../dtos/Employee-usecase/get-all-employee-usecase-interface";
import { IEditEmployeeUsecase } from "../dtos/Employee-usecase/edit-employee-usecase-interface";
import {  IFindAllCoordinatorAndMechanic } from "../dtos/Employee-usecase/find-all-coordinator-usecase";
import { IGetEmployeeProfileUsecase } from "../dtos/Employee-usecase/get-employee-profile-usecase-interface";
import { IGetAvailableMechanicUsecase } from "../dtos/complaint-usecase/get-available-mechanic-usecase-interface";
import { ISafeEmployee } from "../dtos/Employee-usecase/safe-employee-interface";
export default interface IEmployeeRepository  {
  createEmployee(
    employeeName: string,
    emailId: string,
    joinDate: string | Date,
    contactNumber: string,
    address: string | null | undefined,
    currentSalary: number,
    age: number,
    position: 'coordinator' | 'mechanic',
    fieldOfMechanic?: string[],
    previousJob? : string,
    experience? :  number,
  ): Promise<Employee | null>;
  
  getAllEmployees(page?: number, limit?: number): Promise<{
    employees: IGetAllEmployeesUseCase[];
    total: number;
  }>;
  searchEmployees(
  searchTerm: string,
  status: string,
  position: string,
  page: number,
  limit: number
): Promise<{ employees: Employee[]; total: number }>;
  updateStatus(employeeId: string, status: "active" | "inactive"): Promise<void>;
  findAvailableMechanics(): Promise<IGetAvailableMechanicUsecase[]>;
  updateEmployee(employeeId: string, updatedData: Partial<Employee>): Promise<IEditEmployeeUsecase | null>;
  findByEmail(emailId: string): Promise<Employee | null>;
  storeOTP(email: string, otp: string): Promise<void>;
  verifyOTP(email: string, otp: string): Promise<boolean>;
  updatePassword(email: string, hashedPassword: string): Promise<void>;
  findAllMechanics(): Promise<IFindAllCoordinatorAndMechanic[]>;
  findAllCoordinators(): Promise<IFindAllCoordinatorAndMechanic[]>;
  findByEmployeeId(id : string): Promise<IGetEmployeeProfileUsecase | null >
  findCoordinators(): Promise<{ _id: Types.ObjectId; emailId: string; employeeName?: string }[]>;
  updateWorkingStatus(id: string, status: 'Available' | 'Occupied'): Promise<void>;
  findBestMechanic(productName: string, priority: 'high' | 'medium' | 'low'): Promise<ISafeEmployee | null>;
   findBestMechanicExcluding(
    productType: string,
    priority: string,
    excludeMechanicId: string
  ): Promise<Employee | null>;
  softDeleteEmployee(employeeId : string): Promise<Employee>
  updateLastAssignedAt(mechanicId: string): Promise<void>;
}
