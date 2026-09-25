// src/Application/usecases/admin/Employee/getEmployeeProfile.ts
import { inject, injectable } from "inversify";
import IEmployeeRepository from "../../../../domain/Repository/i-employee-repository";
import { TYPES } from "../../../../types";
import { IGetEmployeeProfileUsecaseDto } from "../../../../domain/dtos/Employee-usecase/get-employee-profile-usecase-interface";
import IGetEmployeeProfileUseCase from "../../../interface/admin/employee/get-employee-profile-usecase-interface";


@injectable()
export default class GetEmployeeProfileUseCase implements IGetEmployeeProfileUseCase {
   constructor(
    @inject(TYPES.IEmployeeRepository) private employeeRepo : IEmployeeRepository
  ){}

  async execute(employeeId: string): Promise<IGetEmployeeProfileUsecaseDto | null>
   {
    return this.employeeRepo.findByEmployeeId(employeeId);
  }
}