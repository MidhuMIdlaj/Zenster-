import IComplaintRepository from '../../domain/Repository/i-complaint-repository';
import { ComplaintDocument, ComplaintModel } from "../db/complaint.model"
import Complaint from '../../domain/entities/Complaint';
import { ServerError } from '../../domain/error/complaintError';
import EmployeeModel from '../db/models/employee.model'
import mongoose from 'mongoose';
import { IAcceptComplaintUsecase } from '../../domain/dtos/complaint-usecase/accept-complaint-usecase-interface';
import { IChangeStatusUsecase } from '../../domain/dtos/complaint-usecase/change-status-usecase-interface';
import { ICompleteTaskUsecase } from '../../domain/dtos/complaint-usecase/complete-task-usecase-interface';
import { IDeleteComplaintUsecase } from '../../domain/dtos/complaint-usecase/complaint-delete-usecase-interface';
import { IComplaintRepoReturn } from '../../domain/dtos/complaint-usecase/create-complaint-usecase-interface';
import { IGetComplaintMechanicUsecase } from '../../domain/dtos/complaint-usecase/get-mechanic-complaint-usecase-interface';
import { IComplaint } from '../../domain/complaint/type';

export default class ComplaintRepoImpl implements IComplaintRepository {
  async createComplaint(
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
  ): Promise<IComplaintRepoReturn> {
    try {
      const complaint = await ComplaintModel.create({
        customerEmail,
        customerName,
        customerPhone,
        description,
        assignedMechanics: assignedMechanicId ? [{
          mechanicId: new mongoose.Types.ObjectId(assignedMechanicId),
          status: 'pending',
          assignedAt: new Date(),
          assignedBy: createdBy,
          reason: null
        }] : [],
        createdBy,
        priority,
        notes,
        productName,
        address,
        guaranteeDate,
        warrantyDate,
        status: {
          status: 'pending',
          updatedAt: new Date(),
          updatedBy: createdBy
        },
        complaintNumber: Math.floor(Math.random() * 1000000),
        CreatedByRole: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
        workingStatus: 'pending',
        isDeleted: false
      });
      return this.mapToComplaint(complaint);
    } catch (error) {
      console.error('Error creating complaint:', error);
      throw new ServerError('Failed to create complaint');
    }
  }

  //  async findById(id: string) {
  //   return ComplaintModel.findById(id).lean();
  // }

  async rejectAssignment(complaintId: string, mechanicId: string, reason: string): Promise<IComplaintRepoReturn | null> {
    return ComplaintModel.findOneAndUpdate(
      {
        _id: complaintId,
        "assignedMechanics.mechanicId": mechanicId,
        "assignedMechanics.status": "pending"
      },
      {
        $set: {
          "assignedMechanics.$.status": "rejected",
          "assignedMechanics.$.reason": reason,
          "assignedMechanics.$.rejectedAt": new Date(),
          workingStatus: "rejected",
          "status.status": "rejected",
          "status.updatedAt": new Date(),
          "status.updatedBy": mechanicId,
          rejectedAt: new Date()
        }
      },
      { new: true }
    );
  }

  async reassignComplaint(complaintId: string, newMechanicId: string, assignedBy: string): Promise<ComplaintDocument | null> {
    const newAssignment = {
      mechanicId: newMechanicId,
      assignedAt: new Date(),
      status: "pending",
      assignedBy
    };

    // Update mechanic's lastAssignedAt timestamp
    await EmployeeModel.findByIdAndUpdate(
      newMechanicId,
      { lastAssignedAt: new Date() },
      { new: true }
    ).catch(err => console.error('Error updating lastAssignedAt:', err));

    return ComplaintModel.findByIdAndUpdate(
      complaintId,
      {
        $push: { assignedMechanics: newAssignment },
        $set: {
          workingStatus: "pending",
          "status.status": "pending",
          "status.updatedAt": new Date(),
          "status.updatedBy": assignedBy
        }
      },
      { new: true }
    );
  }

  async updateStatusByMechanic(
    complaintId: string,
    status: string,
    mechanicId: string
  ): Promise<IChangeStatusUsecase> {
    if (!mongoose.Types.ObjectId.isValid(complaintId)) {
      throw new Error("Invalid complaint ID format");
    }

    const updateResult = await ComplaintModel.updateOne(
      {
        _id: complaintId,
        assignedMechanicId: mechanicId
      },
      {
        $set: {
          "status.status": status,
          "status.updatedAt": new Date(),
          "status.updatedBy": mechanicId,
          workingStatus: status === "processing" ? "processing" : undefined
        }
      }
    );
    return { matchedCount: updateResult.matchedCount };
  }


  async deleteComplaint(id: string): Promise<IDeleteComplaintUsecase> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid complaint ID format");
    }
    const findMechanicComplaint = await ComplaintModel.findOne({ _id: id });
    if (!findMechanicComplaint) {
      throw new Error("Complaint not found");
    }

    const employeeId = findMechanicComplaint.assignedMechanics[0]?.mechanicId;

    await EmployeeModel.updateOne({ _id: employeeId }, { $set: { workingStatus: 'Available' } })

    const result = await ComplaintModel.updateOne(
      { _id: id },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      }
    );

    return result;
  }

  async getAllComplaints(): Promise<IComplaintRepoReturn[]> {
    try {
      const complaints = await ComplaintModel.find({ isDeleted: { $ne: true } })
        .populate('assignedMechanics.mechanicId')
        .lean()
        .sort({ createdAt: -1 });
      return complaints.map((complaint) => this.mapToComplaint(complaint));
    } catch (error) {
      console.error('Error fetching complaints:', error);
      throw new ServerError('Failed to fetch complaints');
    }
  }

  async getComplaintsByMechanic(mechanicId: string): Promise<IGetComplaintMechanicUsecase[]> {
    try {
      const complaints = await ComplaintModel.find({
        "assignedMechanics.mechanicId": mechanicId,
        isDeleted: false
      }).lean()


      return complaints.map((doc) => {
        const mechanicAssignment = doc.assignedMechanics.find(
          (m) => m.mechanicId.toString() === mechanicId
        );

        return {
          id: doc._id.toString(),
          titel: doc.description,
          clientName: doc.customerName,
          customerEmail: doc.customerEmail || '',
          customerPhone: doc.customerPhone || '',
          location: doc.address || '',
          status: mechanicAssignment?.status || 'pending',
          assignedMechanics: doc.assignedMechanics.map((m) => ({
            mechanicId: m.mechanicId.toString(),
            status: m.status
          })),
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
          workingStatus: doc.workingStatus || 'pending', // Fallback if undefined
          priority: doc.priority || 'medium' // Added priority with default value
        };
      });
    } catch (error) {
      throw new Error("Failed to fetch mechanic complaints");
    }
  }


  async getComplaintById(complaintId: string): Promise<IComplaintRepoReturn | null> {
    try {
      const complaint = await ComplaintModel.findById(complaintId);
      return complaint ? this.mapToComplaint(complaint) : null;
    } catch (error) {
      console.error('Error fetching complaint:', error);
      throw new ServerError('Failed to fetch complaint');
    }
  }

  async getComplaintsByMechanicId(
    coordinator: string
  ): Promise<IComplaintRepoReturn[]> {
    try {
      const complaints = await ComplaintModel.find({
        createdBy: coordinator,
        isDeleted: { $ne: true }
      }).sort({ createdAt: -1 });
      return complaints.map((complaint) => this.mapToComplaint(complaint));
    } catch (error) {
      console.error('Error fetching complaints by mechanic ID:', error);
      throw new ServerError('Failed to fetch complaints by mechanic ID');
    }
  }

  async acceptComplaint(complaintId: string, mechanicId: string): Promise<IAcceptComplaintUsecase> {
    try {
      const result = await ComplaintModel.updateOne(
        { _id: complaintId },
        {
          $set: {
            "assignedMechanics.0.mechanicId": mechanicId,
            workingStatus: "progress",
            status: "Assigned",
          },
        },
        { new: true }
      );
      const mechanicUpdate = await EmployeeModel.updateOne(
        { _id: mechanicId },
        { $set: { workingStatus: "Occupied" } }
      );

      if (!mechanicUpdate) {
        return { success: false, message: "Complaint not found" };
      }

      if (!result) {
        return { success: false, message: "Complaint not found" };
      }

      return { success: true, message: "Complaint accepted successfully" };
    } catch (error) {
      console.error("Repo error in acceptComplaint:", error);
      return { success: false, message: "Internal error during complaint acceptance" };
    }
  }

  async updateComplaintStatus(
    complaintId: string,
    status: string,
    updatedBy: string
  ): Promise<IComplaintRepoReturn | null> {
    try {
      await ComplaintModel.updateOne(
        {
          _id: complaintId,
          'assignedMechanics.mechanicId': updatedBy
        },
        {
          $set: {
            'assignedMechanics.$.status': status,
            'workingStatus': status,
            'status.status': status,
            'status.updatedAt': new Date(),
            'status.updatedBy': updatedBy,
            updatedAt: new Date()
          }
        }
      );

      const complaint = await ComplaintModel.findById(complaintId);

      await EmployeeModel.updateOne({
        _id: updatedBy,
      }, {
        $set: {
          workingStatus: 'Available'
        }
      });

      return complaint ? this.mapToComplaint(complaint) : null;
    } catch (error) {
      console.error('Error updating complaint status:', error);
      throw new ServerError('Failed to update complaint status');
    }
  }


  async completeTask(
    taskId: string,
    mechanicId: string,
    description: string,
    photoNames: string[],
    paymentStatus?: string,
    amount?: number,
    paymentMethod?: string,
  ): Promise<ICompleteTaskUsecase | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(taskId)) {
        console.error(`Invalid taskId: ${taskId}`);
        throw new ServerError('Invalid task ID');
      }
      if (!mongoose.Types.ObjectId.isValid(mechanicId)) {
        console.error(`Invalid mechanicId: ${mechanicId}`);
        throw new ServerError('Invalid mechanic ID');
      }
      let complaint = await ComplaintModel.findOne({ _id: taskId }).lean().exec();
      if (!complaint) {
        console.error(`Complaint not found for taskId: ${taskId}`);
        throw new ServerError('Task not found');
      }

      if (typeof complaint.status === 'string') {
        const updateResult = await ComplaintModel.updateOne(
          { _id: taskId },
          {
            $set: {
              status: {
                status: complaint.status || 'Assigned',
                updatedBy: complaint.createdBy || mechanicId
              }
            }
          }
        );
        if (updateResult.modifiedCount === 0) {
          console.error(`Failed to fix status field for ${taskId}`);
          throw new ServerError('Failed to fix invalid status field');
        }
        complaint = await ComplaintModel.findOne({ _id: taskId }).lean().exec();
        if (!complaint || typeof complaint.status === 'string') {
          console.error(`Status field fix verification failed for ${taskId}:`, complaint?.status);
          throw new ServerError('Failed to verify status field fix');
        }
      } else if (!complaint.status || typeof complaint.status !== 'object' || !complaint.status.status) {
        const updateResult = await ComplaintModel.updateOne(
          { _id: taskId },
          {
            $set: {
              status: {
                status: 'Assigned',
                updatedAt: new Date(),
                updatedBy: complaint.createdBy || mechanicId
              }
            }
          }
        );

        complaint = await ComplaintModel.findOne({ _id: taskId }).lean().exec();
      }

      const updatedComplaint = await ComplaintModel.findOneAndUpdate(
        {
          _id: taskId,
          'assignedMechanics.mechanicId': mechanicId
        },
        {
          $set: {
            'assignedMechanics.$.status': 'completed',
            'workingStatus': 'completed',
            'status.status': 'completed',
            'status.updatedAt': new Date(),
            'status.updatedBy': mechanicId,
            'completionDetails.description': description,
            'completionDetails.photos': photoNames,
            'completionDetails.paymentStatus': paymentStatus,
            'completionDetails.amount': amount,
            'completionDetails.paymentMethod': paymentMethod,
            'completionDetails.completedAt': new Date(),
            'completionDetails.completedBy': mechanicId,
            'updatedAt': new Date()
          }
        },
        { new: true }
      );

      if (!updatedComplaint) {
        console.error(`No matching complaint found for taskId: ${taskId}, mechanicId: ${mechanicId}`);
        throw new ServerError('Task not found or mechanic not assigned to this task');
      }

      // Update employee status
      const employeeUpdateResult = await EmployeeModel.updateOne(
        { _id: mechanicId },
        { $set: { workingStatus: 'Available' } }
      );
      return this.mapToComplaint(updatedComplaint);
    } catch (error) {
      console.error(`Error completing task (taskId: ${taskId}, mechanicId: ${mechanicId}):`, error);
      throw new ServerError(`Failed to complete task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }


  async assignComplaint(
    complaintId: string,
    mechanicId: string
  ): Promise<IComplaintRepoReturn | null> {
    try {
      const complaint = await ComplaintModel.findByIdAndUpdate(
        complaintId,
        {
          assignedMechanicId: mechanicId,
          updatedAt: new Date()
        },
        { new: true }
      );
      return complaint ? this.mapToComplaint(complaint) : null;
    } catch (error) {
      console.error('Error assigning complaint:', error);
      throw new ServerError('Failed to assign complaint');
    }
  }

  async searchComplaints(query: string): Promise<IComplaintRepoReturn[]> {
    try {
      const complaints = await ComplaintModel.find({
        $or: [
          { customerName: { $regex: query, $options: 'i' } },
          { customerEmail: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ]
      }).sort({ createdAt: -1 });
      return complaints.map((complaint) => this.mapToComplaint(complaint));
    } catch (error) {
      console.error('Error searching complaints:', error);
      throw new ServerError('Failed to search complaints');
    }
  }

  private mapToComplaint(doc: any): IComplaintRepoReturn {
    return {
      id: doc._id.toString(),
      complaintNumber: doc.complaintNumber,
      customerEmail: doc.customerEmail,
      customerPhone: doc.customerPhone,
      description: doc.description,
      assignedMechanicId: doc.assignedMechanics?.map((assignment: any) => ({
        mechanicId: assignment.mechanicId?._id || assignment.mechanicId,
        status: assignment.status,
        reason: assignment.reason || null
      })) || [],
      createdBy: doc.createdBy,
      status: doc.status?.status || 'active',
      priority: doc.priority || 'medium',
      customerName: doc.customerName,
      notes: doc.notes || '',
      productName: doc.productName || '',
      address: doc.address || '',
      model: doc.productModel || '',
      guaranteeDate: doc.guaranteeDate,
      warrantyDate: doc.warrantyDate,
      CreatedByRole: doc.CreatedByRole || 'customer',
      createdAt: doc.createdAt || new Date(),
      updatedAt: doc.updatedAt || new Date(),
      workingStatus: doc.workingStatus || 'pending',
      rejectionReason: doc.rejectionReason,
      isDeleted: doc.isDeleted === 'true' ? true : false,
      completionDetails: doc.completionDetails
        ? {
          description: doc.completionDetails.description || '',
          photos: doc.completionDetails.photos || [],
          completedAt: doc.completionDetails.completedAt,
          completedBy: doc.completionDetails.completedBy || '',
          paymentStatus: doc.completionDetails.paymentStatus || '',
          amount: doc.completionDetails.amount || 0,
          paymentMethod: doc.completionDetails.paymentMethod || ''
        }
        : undefined
    };
  }
}
