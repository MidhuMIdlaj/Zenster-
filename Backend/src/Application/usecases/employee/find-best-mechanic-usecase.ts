import { injectable, inject } from "inversify";
import IEmployeeRepository from "../../../domain/Repository/i-employee-repository";
import { TYPES } from "../../../types";
import { ISafeEmployee } from "../../../domain/dtos/Employee-usecase/safe-employee-interface";
import { IFindBestMechanicUseCase } from "../../interface/employee/find-best-mechanic-usecase-interface";

@injectable()
export class FindBestMechanicUseCase implements IFindBestMechanicUseCase {
  constructor(
    @inject(TYPES.IEmployeeRepository) private  mechanicRepo: IEmployeeRepository
  ) {}

 async execute(productType: string, priority: 'low' | 'medium' | 'high' | 'critical'): Promise<ISafeEmployee | null> {
  const actualPriority = priority === 'critical' ? 'high' : priority;
  return await this.mechanicRepo.findBestMechanic(productType, actualPriority);
 }
}
