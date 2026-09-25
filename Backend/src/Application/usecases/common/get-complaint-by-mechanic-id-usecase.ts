import { inject, injectable } from "inversify";
import { TYPES } from "../../../types";
import { IComplaintRepoReturn } from "../../../domain/dtos/complaint-usecase/create-complaint-usecase-interface";
import IGetComplaintsAssignedToMechanicUseCase from "../../interface/common/get-complaint-by-mechanic-id-usecase-interface";
import IComplaintRepository from "../../../domain/Repository/i-complaint-repository";

@injectable()
export default class GetComplaintsAssignedToMechanic implements IGetComplaintsAssignedToMechanicUseCase {
  constructor(
    @inject(TYPES.IComplaintRepository) private readonly complaintRepo: IComplaintRepository
  ) {}

  async execute(mechanicId: string): Promise<IComplaintRepoReturn[]> {
    return await this.complaintRepo.getComplaintsByMechanicId(mechanicId);
  }
}
