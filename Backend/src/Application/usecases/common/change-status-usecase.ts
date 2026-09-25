import { inject, injectable } from "inversify";
import IComplaintRepository from "../../../domain/Repository/i-complaint-repository";
import { TYPES } from "../../../types";
import { IChangeStatusUsecaseDto } from "../../../domain/dtos/complaint-usecase/change-status-usecase-interface";
import { IChangeStatusUseCase } from "../../interface/common/change-status-usecase-interface";

@injectable()
export class ChangeStatusUseCase implements IChangeStatusUseCase {
  constructor(
    @inject(TYPES.IComplaintRepository) private complaintRepo: IComplaintRepository
  ) {}

  async execute(complaintId: string, newStatus: string, mechanicId: string):Promise<IChangeStatusUsecaseDto> {
    return await this.complaintRepo.updateStatusByMechanic(
      complaintId,
      newStatus,
      mechanicId
    );
  }
}
