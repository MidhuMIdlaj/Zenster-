import { inject, injectable } from "inversify";
import IComplaintRepository from "../../../domain/Repository/i-complaint-repository";
import { NotFoundError, ValidationError } from "../../../domain/error/complaintError";
import { TYPES } from "../../../types";
import IAssignComplaintUseCase from "../../interface/common/assign-complain-usecase-interface";

@injectable()
export default class AssignComplaintUseCase implements IAssignComplaintUseCase {
  constructor(
    @inject(TYPES.IComplaintRepository) private complaintRepo: IComplaintRepository
  ) {}

  async execute(
    complaintId: string,
    employeeId: string
  ): Promise<Awaited<ReturnType<IAssignComplaintUseCase["execute"]>>> {
    if (!complaintId) {
      throw new ValidationError('Complaint ID is required');
    }

    if (!employeeId) {
      throw new ValidationError('Employee ID is required');
    }

    const updatedComplaint = await this.complaintRepo.assignComplaint(
      complaintId,
      employeeId
    );

    if (!updatedComplaint) {
      throw new NotFoundError('Complaint not found');
    }

    return updatedComplaint as unknown as Awaited<
      ReturnType<IAssignComplaintUseCase["execute"]>
    >;
  }
}