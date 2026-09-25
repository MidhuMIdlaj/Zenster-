import { inject, injectable } from "inversify";
import IEmployeeRepository from "../../../domain/Repository/i-employee-repository";
import { TYPES } from "../../../types";
import { IGetAvailableMechanicUsecase } from "../../../domain/dtos/complaint-usecase/get-available-mechanic-usecase-interface";
import IGetAvailableMechanicsUseCase from "../../interface/common/get-available-mechanic-usecase-interface";


@injectable()
export class GetAvailableMechanics implements IGetAvailableMechanicsUseCase {
  constructor(
    @inject(TYPES.IEmployeeRepository) private readonly employeeRepository: IEmployeeRepository
  ) {}

  async execute(): Promise<IGetAvailableMechanicUsecase[]> {
    return this.employeeRepository.findAvailableMechanics();
  }
}