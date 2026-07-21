import { Types } from "mongoose";
import IComplaintRepository from "../../../domain/Repository/i-complaint-repository";
import IEmployeeRepository from "../../../domain/Repository/i-employee-repository";
import ServiceRequest from "../../../domain/entities/Complaint";
import { inject, injectable } from "inversify";
import { TYPES } from "../../../types";
import IUserRepository from "../../../domain/Repository/i-user-repository";
import { INotificationRepository } from "../../../domain/Repository/i-notification-repository";
import { IComplaintRepoReturn } from "../../../domain/dtos/complaint-usecase/create-complaint-usecase-interface";
import { Product } from "../../../domain/entities/User";
import { ICreateComplaintUseCase } from "../../interface/common/create-complaint-usecase-interface";
import { ComplaintReassignmentScheduler } from "../../../infrastructure/Services/scheduler-service";


@injectable()
export class CreateComplaintUseCase implements ICreateComplaintUseCase {
  constructor(
    @inject(TYPES.IComplaintRepository) private complaintRepository: IComplaintRepository,
    @inject(TYPES.IEmployeeRepository) private employeeRepository: IEmployeeRepository,
    @inject(TYPES.IUserRepository) private userRepository: IUserRepository,
    @inject(TYPES.INotificationRepository) private notificationRepository: INotificationRepository,
    @inject(TYPES.ComplaintReassignmentScheduler) private complaintReassign: ComplaintReassignmentScheduler,

  ) { }
  async execute(data: {
    customerName?: string;
    customerEmail?: string;
    contactNumber?: string;
    description: string;
    selectedProductId?: string;
    assignedMechanicId?: string | { mechanicId?: string }[];
    createdBy: string;
    priority?: 'low' | 'medium' | 'high';
    notes?: string;
    address?: string;
  }): Promise<{ success: boolean; data?: IComplaintRepoReturn; error?: string }> {
    try {
      let productDetails = null;
      let clientDetails = null;
      if (data.selectedProductId) {
        clientDetails = await this.userRepository.getProductClientById(data.selectedProductId);
        if (!clientDetails) {
          return { success: false, error: 'Client with this product not found' };
        }
        console.log(clientDetails, "clientDetails")
        productDetails = clientDetails.products.find(
          (product: Product) => product?.id?.toString() === data.selectedProductId
        );
        console.log(productDetails, "productDetails")
        if (!productDetails) {
          return { success: false, error: 'Selected product not found' };
        }
      }

      let assignedMechanicId = Array.isArray(data.assignedMechanicId)
        ? data.assignedMechanicId[0]?.mechanicId
        : data.assignedMechanicId;
      let assignedMechanic = null;

      if (!assignedMechanicId && productDetails) {
        console.log(productDetails.productName, "productDetails.productName")
        assignedMechanic = await this.employeeRepository.findBestMechanic(
          productDetails.productName || '',
          data.priority || 'medium',
        );
        console.log(assignedMechanic, "assignedMechanic")
        if (!assignedMechanic) {
          assignedMechanicId = undefined;
        } else {
          assignedMechanicId = assignedMechanic.id.toString();
        }
      }

      const complaintData = {
        customerName: data.customerName || clientDetails?.clientName || 'Unknown',
        customerEmail: data.customerEmail || clientDetails?.email || '',
        customerPhone: data.contactNumber || clientDetails?.contactNumber || '',
        description: data.description,
        createdBy: data.createdBy,
        priority: data.priority || 'medium',
        notes: data.notes || '',
        productName: productDetails?.productName || '',
        address: productDetails ? clientDetails?.address || data.address || '' : data.address || '',
        guaranteeDate: productDetails?.guaranteeDate ? new Date(productDetails.guaranteeDate) : undefined,
        warrantyDate: productDetails?.warrantyDate ? new Date(productDetails.warrantyDate) : undefined
      };

      const savedComplaint = await this.complaintRepository.createComplaint(
        complaintData.customerName,
        complaintData.customerEmail,
        complaintData.customerPhone,
        complaintData.description,
        assignedMechanicId || '',
        complaintData.createdBy,
        complaintData.priority,
        complaintData.notes,
        complaintData.productName,
        complaintData.address,
        complaintData.guaranteeDate,
        complaintData.warrantyDate
      );

      if (assignedMechanicId) {
        await this.notificationRepository.sendNewComplaintNotification(
          assignedMechanicId,
          savedComplaint,
          data.createdBy
        );
        // Update mechanic's lastAssignedAt for fair workload distribution
        await this.employeeRepository.updateLastAssignedAt(assignedMechanicId);
      } else {
        console.log(savedComplaint.id, "savedComplaint.id", savedComplaint)
        await this.complaintReassign.scheduleUnavailableMechanicCheck(
          savedComplaint.id.toString(),
          "in 2 hours"
        );
      }
      return { success: true, data: savedComplaint };
    } catch (error: unknown) {
      console.error('Error creating complaint:', error);

      if (error instanceof Error) {
        return { success: false, error: error.message };
      }

      return { success: false, error: 'Internal server error' };
    }
  }
}
