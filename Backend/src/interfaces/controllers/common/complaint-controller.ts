import { NextFunction, Request, Response } from 'express';
import { StatusCode } from '../../../shared/enums/statusCode';
import { sendError, sendResponse, sendSuccess } from '../../../shared/response';
import GetCustomerEmails from '../../../Application/usecases/admin/Users/get-customer-email-usecase';
import GetCoordinatorEmails from '../../../Application/usecases/employee/get-coordinator-email-usecase';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../../types';
import { ComplaintAttachmentUploader } from '../../../infrastructure/Services/s3-credential-service';
import IGetEmployeeProfileUseCase from '../../../Application/interface/admin/employee/get-employee-profile-usecase-interface';
import { IAcceptComplaintUseCase } from '../../../Application/interface/common/accept-complaint-usecase-interface';
import { IChangeStatusUseCase } from '../../../Application/interface/common/change-status-usecase-interface';
import { ICompleteTaskUseCase } from '../../../Application/interface/common/complete-task-usecase-interface';
import { ICreateComplaintUseCase } from '../../../Application/interface/common/create-complaint-usecase-interface';
import IDeleteComplaintUseCase from '../../../Application/interface/common/delete-complaint-usecase-interface';
import IFindCustomerByEmailUseCase from '../../../Application/interface/common/find-customer-by-email-usecase-interface';
import IGetAllComplaintsUseCase from '../../../Application/interface/common/get-all-complaint-usecase-interface';
import IGetAvailableMechanicsUseCase from '../../../Application/interface/common/get-available-mechanic-usecase-interface';
import IGetComplaintsAssignedToMechanicUseCase from '../../../Application/interface/common/get-complaint-by-mechanic-id-usecase-interface';
import IGetMechanicComplaintUseCase from '../../../Application/interface/common/get-mechanic-complaint-usecase-interface';
import { IRejectComplaintUseCase } from '../../../Application/interface/common/reject-complaint-usecase-interface';
import { IUpdateComplaintStatusUseCase } from '../../../Application/interface/common/update-complaint-status-usecase-interface';
import { IValidateAdminCoordinatorUseCase } from '../../../Application/interface/common/validate-admin-coordinator-email-usecase-interface';
import { IGetCoordinatorEmails } from '../../../Application/interface/employee/get-coordinator-email-usecase-interface';
import { IGetCustomerEmails } from '../../../Application/interface/admin/user/get-customer-email-usecase';


@injectable()
export default class ComplaintController {
  constructor(
     @inject(TYPES.createComplaintUseCase) private createComplaintUseCase : ICreateComplaintUseCase,
     @inject(TYPES.findCustomerByEmailUseCase) private findCustomerByEmailUseCase : IFindCustomerByEmailUseCase,
     @inject(TYPES.getAvailableMechanicUseCase) private getAvailableMechanicUseCase : IGetAvailableMechanicsUseCase,
     @inject(TYPES.validateAdminCoordinatorUseCase) private validateAdminCoordinatorUseCase : IValidateAdminCoordinatorUseCase,
     @inject(TYPES.getAllComplaintsUseCase) private getAllComplaintsUseCase : IGetAllComplaintsUseCase,
     @inject(TYPES.getMechanicComplaintUseCase) private getMechanicComplaintUseCase : IGetMechanicComplaintUseCase,
     @inject(TYPES.getEmployeeProfileUsecases) private getEmployeeProfileUsecases : IGetEmployeeProfileUseCase,
     @inject(TYPES.acceptComplaintUseCase) private acceptComplaintUseCase : IAcceptComplaintUseCase,
     @inject(TYPES.getCustomerEmailsUsecases) private getCustomerEmailsUsecases : IGetCustomerEmails,
     @inject(TYPES.GetComplaintsAssignedToMechanic) private GetComplaintsAssignedToMechanic : IGetComplaintsAssignedToMechanicUseCase,
     @inject(TYPES.getCoordinatorEmails) private getCoordinatorEmailsUsecases :  IGetCoordinatorEmails,
     @inject(TYPES.rejectComplaintUsecase) private rejectComplaintUsecase : IRejectComplaintUseCase,
     @inject(TYPES.changeStatusUseCase) private ChangeStatusUseCase : IChangeStatusUseCase,
     @inject(TYPES.deleteComplaintUseCase) private deleteComplaintUseCase : IDeleteComplaintUseCase,
     @inject(TYPES.updateComplaintStatusUsecase) private updateComplaintStatusUsecase : IUpdateComplaintStatusUseCase,
     @inject(TYPES.completeTaskUseCase) private completeTaskUseCase : ICompleteTaskUseCase,
     @inject(TYPES.ComplaintAttachmentUploader) private ComplaintAttachmentUploader : ComplaintAttachmentUploader
  ){} 


  createClientComplaint = async (req: Request, res: Response) => {
    try {
      const result = await this.createComplaintUseCase.execute(req.body);
      if (result.success) {
        sendSuccess(res, result.data, 'Complaint created successfully', StatusCode.CREATED);
      } else {
        sendError(res, result.error || 'Failed to create complaint', StatusCode.BAD_REQUEST);
      }
    } catch (error) {
      console.error('🚑 Server error:', error);
      sendError(res, 'Internal server error', StatusCode.INTERNAL_SERVER_ERROR);
    }
  };
  
  findCustomerByEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;
      if (!email) {
        sendError(res, "Email is required", StatusCode.BAD_REQUEST);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        sendError(res, "Invalid email format", StatusCode.BAD_REQUEST);
        return;
      }

      const customer = await this.findCustomerByEmailUseCase.execute(email);
      if (!customer) {
        sendResponse(res, {
          success: true,
          statusCode: StatusCode.OK,
          message: "Customer not found",
          data: null,
          exists: false
        });
        return;
      }
      
      const responseData = {
        productName: customer.data?.products?.[0]?.productName || null, 
        model: customer.data?.products?.[0]?.model || null,            
        status: customer.data?.status,
        warrantyDate: customer.data?.products?.[0]?.warrantyDate || null,
        guaranteeDate: customer.data?.products?.[0]?.guaranteeDate || null,
        id: customer.data?.id,
        name: customer.data?.name,
        email: customer.data?.email,
        address: customer.data?.address,
        products: customer.data?.products || []
      };

      sendResponse(res, {
        success: true,
        statusCode: StatusCode.OK,
        message: "Customer found",
        data: responseData,
        exists: true
      });
    } catch (err) {
      next(err);
    }
  };

  getAvailableMechanicsHandler = async (req: Request, res: Response) => {
    try {
      const mechanics = await this.getAvailableMechanicUseCase.execute();
      const mechanicsDto = mechanics.map(mech => ({
        mechanicId: mech.id,
        name: mech.employeeName,
        specialization: mech.experience ? `${mech.experience} years experience` : 'Mechanic',
        contactNumber: mech.contactNumber,
        email: mech.emailId,
        workingStatus: mech.workingStatus
      }));

      sendSuccess(res, mechanicsDto, 'Available mechanics retrieved successfully', StatusCode.OK);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Error fetching available mechanics:", errorMessage);
      sendError(res, "Error fetching available mechanics", StatusCode.INTERNAL_SERVER_ERROR, errorMessage);
    }
  }

  validateAdminCoordinatorEmail = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) {
        sendError(res, "Email is required", StatusCode.BAD_REQUEST);
        return;
      }

      const emailRegex = /^[^\s@]+@[^^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        sendError(res, "Invalid email format", StatusCode.BAD_REQUEST);
        return;
      }

      const result = await this.validateAdminCoordinatorUseCase.execute(email);
      if (!result.isValid) {
        sendResponse(res, {
          success: true,
          statusCode: StatusCode.OK,
          message: "Email does not belong to an admin or coordinator",
          data: null,
          isValid: false
        });
        return;
      }

      sendResponse(res, {
        success: true,
        statusCode: StatusCode.OK,
        message: `Valid ${result.userType} email`,
        data: {
          userType: result.userType,
          user: result.user,
          id: result.id
        },
        isValid: true
      });
      return;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error occurred";
      sendError(res, message, StatusCode.INTERNAL_SERVER_ERROR);
      return;
    }
  };

  getAllComplaints = async (req: Request, res : Response) => {
    try {
      const complaints = await this.getAllComplaintsUseCase.execute();
      sendSuccess(res, { complaints }, 'Complaints retrieved successfully', StatusCode.OK);
    } catch (error: unknown) {
      console.error("error from get Complaint :", error);
      sendError(res, 'Failed to fetch complaints', StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  getMechanicComplaint = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const complaints = await this.getMechanicComplaintUseCase.execute(id);
      sendSuccess(res, { complaints }, 'Mechanic complaints retrieved successfully', StatusCode.OK);
    } catch (error: unknown) {
      console.error(error);
      sendError(res, 'Failed to fetch complaints', StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  
 acceptComplaint = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; 
    const { mechanicId } = req.body;
    
    if (!mechanicId) {
      sendError(res, 'Mechanic ID is required', StatusCode.BAD_REQUEST);
      return;
    }

    const mechanic = await this.getEmployeeProfileUsecases.execute(mechanicId);
    if (!mechanic) {
      sendError(res, 'Mechanic not found', StatusCode.NOT_FOUND);
      return;
    }

    console.log('Mechanic working status:', mechanic);
    if (mechanic.workingStatus !== 'Available') {
      sendError(res, 'Cannot accept new tasks. Mechanic is currently occupied with another task.', StatusCode.BAD_REQUEST, undefined, { mechanicStatus: mechanic.workingStatus });
      return;
    }
    const result = await this.acceptComplaintUseCase.execute(id, mechanicId);
    if (!result.success) {
      sendError(res, result.message || 'Failed to accept complaint', StatusCode.BAD_REQUEST);
      return;
    }
    sendSuccess(res, result, 'Complaint accepted successfully', StatusCode.OK);
   } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to accept complaint';
    console.error('Error in acceptComplaint:', message);
    sendError(res, message, StatusCode.INTERNAL_SERVER_ERROR);
  }
}

   getCustomerEmails = async (_req: Request, res: Response) => {
    try {
      const customers = await this.getCustomerEmailsUsecases.execute();
      sendSuccess(res, { customers }, 'Customer emails retrieved successfully', StatusCode.OK);
    } catch (error: unknown) {
      console.error(error);
      sendError(res, 'Failed to fetch customer emails', StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  getComplaintsByCoordinator = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 'User ID is required', StatusCode.BAD_REQUEST);
        return;
      }
      const complaints = await this.GetComplaintsAssignedToMechanic.execute(userId);
      sendSuccess(res, { complaints }, 'Complaints fetched successfully', StatusCode.OK);
    } catch (error: unknown) {
      console.error('Error fetching complaints by coordinator:', error);
      sendError(res, 'Failed to fetch complaints by coordinator', StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  getCoordinatorEmails = async (_req: Request, res: Response) => {
    try {
      const coordinators = await this.getCoordinatorEmailsUsecases.execute();
      sendSuccess(res, { coordinators }, 'Coordinator emails retrieved successfully', StatusCode.OK);
    } catch (error: unknown) {
      console.error(error);
      sendError(res, 'Failed to fetch coordinator emails', StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

rejectComplaint = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { mechanicId, reason } = req.body;

    if (!mechanicId || !reason?.trim()) {
      sendError(res, 'Mechanic ID and reason are required', StatusCode.BAD_REQUEST);
      return;
    }

    const result = await this.rejectComplaintUsecase.execute(id, mechanicId, reason);
    sendSuccess(res, result, 'Complaint rejected successfully', StatusCode.OK);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to reject complaint';
    console.error('Error in rejectComplaint:', message);
    sendError(res, message, StatusCode.INTERNAL_SERVER_ERROR);
  }
}

  ChangeStatus = async (req: Request, res: Response) => {
    try {
      const { id } = req.params; 
      const { newStatus, updatedBy } = req.body;
      if (!newStatus) {
        sendError(res, 'Status is required in payload', StatusCode.BAD_REQUEST);
        return;
      }
      const result = await this.ChangeStatusUseCase.execute(id, newStatus, updatedBy);
      if (result.matchedCount === 0) {
        sendError(res, 'Complaint not found or not assigned to this mechanic', StatusCode.NOT_FOUND);
        return;
      }
      sendSuccess(res, { data: result }, 'Status updated successfully', StatusCode.OK);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update complaint status';
      console.error('Error in ChangeStatus:', message);
      sendError(res, message, StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

   DeleteComplaint = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await this.deleteComplaintUseCase.execute(id);
      if (result.matchedCount === 0) {
        sendError(res, 'Complaint not found', StatusCode.NOT_FOUND);
        return;
      }
      sendSuccess(res, { data: result }, 'Complaint deleted successfully', StatusCode.OK);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete complaint';
    console.error('Error in deleteComplaint:', message);
    sendError(res, message, StatusCode.INTERNAL_SERVER_ERROR);
   }
  }

  updateComplaint = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, mechanicId } = req.body;
      if (!id) {
        sendError(res, 'Complaint ID is required', StatusCode.BAD_REQUEST);
        return;
      }
      const updatedComplaint = await this.updateComplaintStatusUsecase.execute(id, status, mechanicId);
      if (!updatedComplaint) {
        sendError(res, 'Complaint not found', StatusCode.NOT_FOUND);
        return;
      }
      sendSuccess(res, { data: updatedComplaint }, 'Complaint updated successfully', StatusCode.OK);
    } catch (error: unknown) {
      console.error('Error in updateComplaint:', error);
      sendError(res, (error instanceof Error ? error.message : 'Failed to update complaint'), StatusCode.INTERNAL_SERVER_ERROR);
    }
  }

completeTask = async (req: Request, res: Response) => {
  try {
    const { taskId, mechanicId, description, paymentStatus, amount, paymentMethod, isUnderWarranty } = req.body;
    const files = req.files as Express.Multer.File[];
    const underWarranty = isUnderWarranty === true || isUnderWarranty === 'true';
    if (!taskId || !mechanicId || !description) {
      sendError(res, 'Task ID, mechanic ID, and description are required', StatusCode.BAD_REQUEST);
      return;
    }
    if (!underWarranty && (!paymentMethod || !paymentStatus || amount === undefined || amount === null || Number(amount) <= 0)) {
      sendError(res, 'Payment status, amount, and method are required for non-warranty tasks', StatusCode.BAD_REQUEST);
      return;
    }
    let photoUrls: string[] = [];
    for (const file of files || []) {
      const url = await this.ComplaintAttachmentUploader.uploadFile(file);
      photoUrls.push(url);
    }

    const completedTask = await this.completeTaskUseCase.execute(
      taskId,
      mechanicId,
      description,
      photoUrls,
      underWarranty ? 'not_required' : paymentStatus,
      underWarranty ? 0 : Number(amount), 
      underWarranty ? 'warranty' : paymentMethod
    );

    if (!completedTask) {
      sendError(res, 'Task not found', StatusCode.NOT_FOUND);
      return;
    }
    console.log('Completed Task:', completedTask);
    sendSuccess(res, { data: completedTask }, 'Task completed successfully', StatusCode.OK);
  } catch (error: unknown) {
    console.error('Error in completeTask:', error);
    sendError(res, (error instanceof Error ? error.message : 'Failed to complete task'), StatusCode.INTERNAL_SERVER_ERROR);
  }
 };
}
