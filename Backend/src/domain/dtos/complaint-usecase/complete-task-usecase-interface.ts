import { CompletionDetails, MechanicAssignment } from "../../entities/Complaint";

export interface ICompleteTaskUsecaseDto {
  id: string;
  complaintNumber: number;
  customerEmail: string;
  customerPhone: string;
  description: string;
  assignedMechanicId: MechanicAssignment[];
  createdBy: string;
  status: 'active' | 'completed' | 'cancelled' | 'on-hold';
  priority: 'low' | 'medium' | 'high' | 'critical';
  customerName: string;
  notes?: string;
  productName: string;
  address: string;
  model: string;
  guaranteeDate: Date | string;
  warrantyDate: Date | string;
  CreatedByRole: 'admin' | 'technician' | 'customer';
  createdAt: Date | string;
  updatedAt: Date | string;
  workingStatus: 'pending' | 'in-progress' | 'completed' | 'rejected';
  rejectionReason?: string;
  isDeleted: boolean;
  completionDetails?: CompletionDetails;
  paymentStatus?: string;
  amount?: number; 
  paymentMethod?: string;
}
