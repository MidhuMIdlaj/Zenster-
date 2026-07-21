import mongoose from "mongoose";
import { IAdminRepository } from "../../../domain/Repository/i-admin-repository";
import IComplaintRepository from "../../../domain/Repository/i-complaint-repository";
import IEmployeeRepository from "../../../domain/Repository/i-employee-repository";
import { ComplaintReassignmentScheduler } from "../../../infrastructure/Services/scheduler-service";
import { inject, injectable } from "inversify";
import { TYPES } from "../../../types";
import GetComplaintByIdUseCase from "./get-complaint-by-id-usecase";
import { IEmailService } from "../../../domain/Repository/i-email-repository";
import { IRejectComplaintUseCase } from "../../interface/common/reject-complaint-usecase-interface";

@injectable()
export class RejectComplaintUseCase  implements IRejectComplaintUseCase{
  constructor(
    @inject(TYPES.IComplaintRepository) private complaintRepo : IComplaintRepository,
    @inject(TYPES.IEmployeeRepository) private employeeRepo : IEmployeeRepository,
    @inject(TYPES.IAdminRepository) private adminRepo : IAdminRepository,
    @inject(TYPES.IEmailService) private emailServices : IEmailService,
    @inject(TYPES.ComplaintReassignmentScheduler) private complaintReassign: ComplaintReassignmentScheduler,
    @inject(TYPES.getComplaintByIdUsecase) private getComplaintByIdUsecase : GetComplaintByIdUseCase,
  ) {}

  async execute(complaintId: string, mechanicId: string, reason: string) {
    const complaint = await this.getComplaintByIdUsecase.execute(complaintId);
    if (!complaint) throw new Error("Complaint not found");

    const assignment = complaint.assignedMechanicId.find(
  (m: { mechanicId: mongoose.Types.ObjectId }) => m.mechanicId.toString() === mechanicId
);


    if (!assignment) {
      throw new Error("Mechanic not assigned to this complaint");
    }

    if (assignment.status !== 'pending') {
      return {
        success: false,
        message: `Already ${assignment.status}`,
        currentStatus: assignment.status,
        complaint
      };
    }

    const rejectedComplaint = await this.complaintRepo.rejectAssignment(
      complaintId, mechanicId, reason
    );

    await this.employeeRepo.updateWorkingStatus(mechanicId, "Available");

    const oldMechanic = await this.employeeRepo.findByEmployeeId(mechanicId);
    if (!oldMechanic) throw new Error("Mechanic not found");
    const newMechanic = await this.employeeRepo.findBestMechanicExcluding(
      complaint.productName,
      complaint.priority,
      mechanicId
    );

    const creatorEmail = await this.getCreatorEmail(complaint.createdBy);
    if (newMechanic && newMechanic.id.toString() !== mechanicId) {
      const updatedComplaint = await this.complaintRepo.reassignComplaint(
        complaintId, newMechanic.id.toString(), complaint.createdBy
      );

      await this.emailServices.sendComplaintReassignmentEmail(creatorEmail, {
        complaintId,
        productName: complaint.productName,
        complaintDetails: complaint.description,
        oldMechanic: {
          id: oldMechanic.id.toString(),
          name: oldMechanic.employeeName || "Unknown"
        },
        newMechanic: {
          id: newMechanic.id.toString(),
          name: newMechanic.employeeName || "Unknown"
        },
        rejectionReason: reason,
        coordinatorName: creatorEmail
      });

      return {
        success: true,
        message: "Complaint rejected and reassigned",
        complaint: updatedComplaint
      };
    } else {
      await this.complaintReassign.scheduleReassignment(complaintId, mechanicId, "in 2 hours");

      await this.emailServices.sendComplaintReassignmentEmail(creatorEmail, {
        complaintId,
        productName: complaint.productName,
        complaintDetails: complaint.description,
        oldMechanic: {
          id: oldMechanic.id.toString(),
          name: oldMechanic.employeeName || "Unknown"
        },
        newMechanic: {
          id: '',
          name: 'Will be reassigned after 2 hours'
        },
        rejectionReason: reason,
        coordinatorName: creatorEmail
      });

      return {
        success: true,
        message: "Reassignment scheduled after 2 hours",
        complaint: rejectedComplaint
      };
    }
  }

  private async getCreatorEmail(creatorId: string) {
    const admin = await this.adminRepo.findById(creatorId);
    if (admin) return admin.email;

    const coordinator = await this.employeeRepo.findByEmployeeId(creatorId);
    return coordinator?.emailId || '';
  }
}
