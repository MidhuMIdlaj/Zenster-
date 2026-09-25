import { Document } from "mongoose";
import { IAcceptComplaintUsecaseDto } from "../dtos/complaint-usecase/accept-complaint-usecase-interface";
import { IChangeStatusUsecaseDto } from "../dtos/complaint-usecase/change-status-usecase-interface";
import { IDeleteComplaintUsecaseDto } from "../dtos/complaint-usecase/complaint-delete-usecase-interface";
import { ICompleteTaskUsecaseDto } from "../dtos/complaint-usecase/complete-task-usecase-interface";
import { IComplaintRepoReturn } from "../dtos/complaint-usecase/create-complaint-usecase-interface";
import { IGetComplaintMechanicUsecase } from "../dtos/complaint-usecase/get-mechanic-complaint-usecase-interface";


export default interface IComplaintRepository {
  createComplaint(
    customerName: string,
    customerEmail: string,
    customerPhone: string,
    description: string,
    assignedMechanicId: string,
    createdBy: string,
    priority: 'low' | 'medium' | 'high',
    notes?: string,
    productName?: string,
    address?: string,
    guaranteeDate?: Date,
    warrantyDate?: Date,
  ): Promise<IComplaintRepoReturn>;
  acceptComplaint(complaintId: string, mechanicId: string): Promise<IAcceptComplaintUsecaseDto>;
  getComplaintsByMechanic(mechanicId: string): Promise<IGetComplaintMechanicUsecase[]>;
  getAllComplaints(): Promise<IComplaintRepoReturn[]>;
  getComplaintById(complaintId: string): Promise<IComplaintRepoReturn | null>;
  updateComplaintStatus(complaintId: string, status: string, updatedBy: string): Promise<IComplaintRepoReturn | null>;
  completeTask(taskId: string, mechanicId: string, description: string, photoPaths: string[] ,  paymentStatus?: string,amount?: number, paymentMethod?: string): Promise<ICompleteTaskUsecaseDto | null>;
  assignComplaint(complaintId: string, mechanicId: string): Promise<IComplaintRepoReturn | null>;
  searchComplaints(query: string): Promise<IComplaintRepoReturn[]>;
  getComplaintsByMechanicId(mechanicId: string): Promise<IComplaintRepoReturn[]>;
  rejectAssignment(complaintId: string, mechanicId: string, reason: string): Promise<IComplaintRepoReturn | null>;
  reassignComplaint(complaintId: string, newMechanicId: string, assignedBy: string): Promise<IComplaintRepoReturn | null>;
   updateStatusByMechanic(
    complaintId: string,
    status: string,
    mechanicId: string
  ): Promise<IChangeStatusUsecaseDto>;
  deleteComplaint(id: string): Promise<IDeleteComplaintUsecaseDto>;
}