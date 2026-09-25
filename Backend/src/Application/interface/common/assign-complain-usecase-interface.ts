import Complaint from "../../../domain/entities/Complaint";

export default interface IAssignComplaintUseCase {
  execute(
    complaintId: string,
    employeeId: string
  ): Promise<   Complaint | null>;
}