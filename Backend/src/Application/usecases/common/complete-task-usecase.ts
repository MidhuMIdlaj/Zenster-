import { inject, injectable } from "inversify";
import IComplaintRepository from "../../../domain/Repository/i-complaint-repository";
import  Complaint  from "../../../domain/entities/Complaint";
import { TYPES } from "../../../types";
import { ICompleteTaskUsecaseDto } from "../../../domain/dtos/complaint-usecase/complete-task-usecase-interface";
import { ICompleteTaskUseCase } from "../../interface/common/complete-task-usecase-interface";

@injectable()
export default class CompleteTaskUseCase implements ICompleteTaskUseCase {
  constructor(
    @inject(TYPES.IComplaintRepository) private readonly complaintRepo: IComplaintRepository
  ) {}

  async execute(
    taskId: string,
    mechanicId: string,
    description: string,
    photoPaths: string[],
    paymentStatus?: string,
    amount?: number,  
    paymentMethod?: string
  ): Promise<ICompleteTaskUsecaseDto | null> {
    if (!taskId || !mechanicId || !description) {
      throw new Error("Task ID, mechanic ID, and description are required");
    }

    return await this.complaintRepo.completeTask(
      taskId,
      mechanicId,
      description,
      photoPaths,
      paymentStatus,
      amount,
      paymentMethod
    );
  }
}
