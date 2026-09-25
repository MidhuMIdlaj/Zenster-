import { inject, injectable } from "inversify";
import IComplaintRepository from "../../../domain/Repository/i-complaint-repository";
import IEmployeeRepository from "../../../domain/Repository/i-employee-repository";
import { TYPES } from "../../../types";
import { IAcceptComplaintUsecaseDto } from "../../../domain/dtos/complaint-usecase/accept-complaint-usecase-interface";
import { IAcceptComplaintUseCase } from "../../interface/common/accept-complaint-usecase-interface";

@injectable()
export class AcceptComplaint implements IAcceptComplaintUseCase {
  constructor(
    @inject(TYPES.IComplaintRepository) private complaintRepo : IComplaintRepository,
    @inject(TYPES.IEmployeeRepository) private employeeRepo : IEmployeeRepository
  ) {}

  async execute(complaintId: string, mechanicId: string): Promise<IAcceptComplaintUsecaseDto> {
    if (!mechanicId) {
      return { success: false, message: "Mechanic ID is required" };
    }

    const mechanic = await this.employeeRepo.findByEmployeeId(mechanicId);
    if (!mechanic) {
      return { success: false, message: "Mechanic not found" };
    }

    if (mechanic.workingStatus !== "Available") {
      return {
        success: false,
        message:
          "Cannot accept new tasks. Mechanic is currently occupied with another task.",
        mechanicStatus: mechanic.workingStatus,
      };
    }
    const result = await this.complaintRepo.acceptComplaint(complaintId, mechanicId);
    return result;
  }
}
