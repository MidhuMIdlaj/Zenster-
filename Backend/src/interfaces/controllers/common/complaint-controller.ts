import { NextFunction, Request, Response } from 'express';
import { StatusCode } from '../../../shared/enums/statusCode';
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
        res.status(StatusCode.CREATED).json(result.data);
      } else {
        res.status(StatusCode.BAD_REQUEST).json({ error: result.error });
      }
    } catch (error) {
      console.error('🚑 Server error:', error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
  };
  
  findCustomerByEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "Email is required"
        });
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "Invalid email format"
        });
        return;
      }

      const customer = await this.findCustomerByEmailUseCase.execute(email);
      if (!customer) {
        res.status(StatusCode.OK).json({
          success: true,
          exists: false,
          message: "Customer not found",
          data: null
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

      res.status(StatusCode.OK).json({
        success: true,
        exists: true,
        message: "Customer found",
        data: responseData
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
        workingStatus : mech.workingStatus
      }));

      res.status(StatusCode.OK).json(mechanicsDto);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Error fetching available mechanics:", errorMessage);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ 
        success: false,
        message: "Error fetching available mechanics",
        error: errorMessage
      });
    }
  }

  validateAdminCoordinatorEmail = async (req: Request, res: Response) => {
    try {
     const { email } = req.body;
      if (!email) {
         res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "Email is required"
        })
        return
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
         res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "Invalid email format"
        })
        return
      }
      const result = await this.validateAdminCoordinatorUseCase.execute(email);
      if (!result.isValid) {
         res.status(StatusCode.OK).json({
          success: true,
          isValid: false,
          message: "Email does not belong to an admin or coordinator",
          user: null,
        })
         return
      }
       res.status(StatusCode.OK).json({
        success: true,
        isValid: true,
        userType: result.userType,
        message: `Valid ${result.userType} email`,
        user: result.user,
        id : result.id
      })
      return
      
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error occurred";
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message
      });
      return;
    }
  };

  getAllComplaints = async (req: Request, res : Response)=>{
    try {
      const complaints = await this.getAllComplaintsUseCase.execute()
      res.status(StatusCode.OK).json({ success: true, complaints });
    } catch (error) {
      console.error("error from get Complaint :", error)
    }
  }

  getMechanicComplaint = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const complaints = await this.getMechanicComplaintUseCase.execute(id);
      res.status(StatusCode.OK).json(complaints);
    } catch (error) {
      console.error(error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ error: "Failed to fetch complaints" });
    }
  }

  
 acceptComplaint = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; 
    const { mechanicId } = req.body;
    
    if (!mechanicId) {
      res.status(StatusCode.BAD_REQUEST).json({ error: 'Mechanic ID is required' })
      return
    }
    const mechanic = await this.getEmployeeProfileUsecases.execute(mechanicId);
    if (!mechanic) {
      res.status(StatusCode.NOT_FOUND).json({ error: 'Mechanic not found' });
      return;
    }
    console.log('Mechanic working status:', mechanic);
    if (mechanic.workingStatus !== 'Available') {
      res.status(StatusCode.BAD_REQUEST).json({ 
        error: 'Cannot accept new tasks. Mechanic is currently occupied with another task.',
        mechanicStatus: mechanic.workingStatus 
      });
      return;
    }
    const result = await this.acceptComplaintUseCase.execute(id, mechanicId);
    if (!result.success) {
      res.status(StatusCode.BAD_REQUEST).json({ error: result.message });
      return;
    }

    res.status(StatusCode.OK).json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to accept complaint';
      console.error('Error in acceptComplaint:', message);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ 
        error: message
      });
    }
}

   getCustomerEmails = async (_req: Request, res: Response) => {
    try {
      const customers = await this.getCustomerEmailsUsecases.execute();
      res.status(StatusCode.OK).json({ 
        success: true,
        customers 
      });
    } catch (error) {
      console.error(error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ 
        success: false,
        error: "Failed to fetch customer emails" 
      });
    }
  }

  getComplaintsByCoordinator  = async(req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(StatusCode.BAD_REQUEST).json({ error: 'User ID is required' });
        return;
      }
      const complaints = await this.GetComplaintsAssignedToMechanic.execute(userId);
      
      res.status(StatusCode.OK).json({
        success: true,
        complaints
      });
    } catch (error) {
      console.error('Error fetching complaints by coordinator:', error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ 
        error: 'Failed to fetch complaints by coordinator' 
      });
    }
  }

  getCoordinatorEmails = async (_req: Request, res: Response) => {
    try {
      const coordinators = await this.getCoordinatorEmailsUsecases.execute();
      res.status(StatusCode.OK).json({ 
        success: true,
        coordinators 
      });
    } catch (error) {
      console.error(error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ 
        success: false,
        error: "Failed to fetch coordinator emails" 
      });
    }
  }

rejectComplaint = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { mechanicId, reason } = req.body;

    if (!mechanicId || !reason?.trim()) {
       res.status(400).json({ error: 'Mechanic ID and reason are required' });
       return;
    }
    const result = await this.rejectComplaintUsecase.execute(id, mechanicId, reason);
    res.status(200).json(result);
    
      } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to reject complaint';
      console.error('Error in rejectComplaint:', message);
      res.status(500).json({ error: message });
    }
}

  ChangeStatus = async (req: Request, res: Response) => {
    try {
      const { id } = req.params; 
      const { newStatus, updatedBy } = req.body;
      if (!newStatus) {
         res.status(StatusCode.BAD_REQUEST).json({ error: 'Status is required in payload' })
         return
      }
      const result = await this.ChangeStatusUseCase.execute(id, newStatus, updatedBy);
      if (result.matchedCount === 0) {
         res.status(StatusCode.NOT_FOUND).json({ error: 'Complaint not found or not assigned to this mechanic' })
         return
      }
      res.status(StatusCode.OK).json({
        success: true,
        message: 'Status updated successfully',
        data: result
      });
      
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update complaint status';
      console.error('Error in ChangeStatus:', message);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ error: message });
    }
  }

   DeleteComplaint = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await this.deleteComplaintUseCase.execute(id);
      if (result.matchedCount === 0) {
          res.status(StatusCode.NOT_FOUND).json({ error: 'Complaint not found' });
          return;
      }
      res.status(StatusCode.OK).json({
          success: true,
          message: 'Complaint deleted successfully',
          data: result
      });
      
   } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete complaint';
      console.error('Error in deleteComplaint:', message);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ error: message });
    }
  }

  updateComplaint = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const {status , mechanicId} = req.body;
      if (!id) {
        res.status(StatusCode.BAD_REQUEST).json({ error: 'Complaint ID is required' });
        return;
      }
      const updatedComplaint = await this.updateComplaintStatusUsecase.execute(id, status, mechanicId);
      if (!updatedComplaint) {
        res.status(StatusCode.NOT_FOUND).json({ error: 'Complaint not found' });
        return;
      }
      res.status(StatusCode.OK).json({
        success: true,
        message: 'Complaint updated successfully',
        data: updatedComplaint
      });       
       
    } catch (error) {
      console.error('Error in updateComplaint:', error);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ 
        error: (error instanceof Error ? error.message : 'Failed to update complaint')
      });
    }
  }

completeTask = async (req: Request, res: Response) => {
  try {
    const { taskId, mechanicId, description , paymentStatus, amount , paymentMethod, isUnderWarranty } = req.body;
    const files = req.files as Express.Multer.File[];
    const underWarranty = isUnderWarranty === true || isUnderWarranty === 'true';
    if (!taskId || !mechanicId || !description) {
       res.status(StatusCode.BAD_REQUEST).json({ 
        error: 'Task ID, mechanic ID, and description are required' 
      });
      return
    }
    if (!underWarranty && (!paymentMethod || !paymentStatus || amount === undefined || amount === null || Number(amount) <= 0)) {
       res.status(StatusCode.BAD_REQUEST).json({ 
        error: 'Payment status, amount, and method are required for non-warranty tasks' 
      });
      return
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
       res.status(StatusCode.NOT_FOUND).json({ error: 'Task not found' });
       return
    }
    console.log('Completed Task:', completedTask);
    res.status(StatusCode.OK).json({
      success: true,
      message: 'Task completed successfully',
      data: completedTask
    });

  } catch (error) {
    console.error('Error in completeTask:', error);
    res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ 
      error: (error instanceof Error ? error.message : 'Failed to complete task')
    });
  }
 };
}
