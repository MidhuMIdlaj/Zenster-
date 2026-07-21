
import { Product } from "./dashboard";

export type ComplaintStatus = 'pending' | 'processing' | 'completed' | 'accepted' | 'rejected'

export interface Complaint {
  customerEmail : string;
  _id: string;
  customerName?: string;
  customerPhone?: string;
  description?: string;
  model?: string;
  workingStatus: ComplaintStatus;
  status?: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  updatedAt: string;
  contactNumber?: string;
  productName?: string;
  assignedMechanicId: string;
  createdBy: string;
}

export type DateType = Date | string;

export interface MechanicAssignment {
  mechanicId: string; 
  status: 'accept' | 'reject' | 'pending';
  reason?: string | null;
}

export interface CompletionDetails {
  description: string;
  photos: string[];
  completedAt: DateType;
  completedBy: string;
  paymentStatus?: string;
  paymentMethod?: string | null;
  amount?: number;
}

export interface ComplaintFormData {
  id?: string;
  complaintNumber?: string;
  customerName?: string;
  customerEmail: string;
  customerPhone?: string;
  contactNumber?: string;
  description: string;
  assignedMechanicId?: string | MechanicAssignment[];
  createdBy: string;
  status?: 'active' | 'completed' | 'cancelled' | 'on-hold' | string; // Added specific types
  priority: 'low' | 'medium' | 'high' | 'critical' | string; // Added specific types
  notes?: string;
  productName?: string;
  address?: string;
  model?: string;
  guaranteeDate?: DateType;
  warrantyDate?: DateType;
  CreatedByRole?: 'admin' | 'technician' | 'customer' | string; // Added specific types
  createdAt?: DateType;
  updatedAt?: DateType;
  workingStatus: 'pending' | 'in-progress' | 'completed' | 'rejected' | string; // Added specific types
  rejectionReason?: string;
  isDeleted?: boolean;
  completionDetails?: CompletionDetails;
  createdByEmail?: string;
  resolvedAt?: DateType;
  selectedProductId?: string;
  products?: (Product & { _id?: string })[];
}

export interface ComplaintResponse extends ComplaintFormData {
  isDeleted?: boolean;
  id: string
}

export interface Mechanic {
  mechanicId: string;
  name: string;
  specialization?: string;
  contactNumber: string;
  email: string;
  workingStatus?: 'Available' | 'Occupied' | 'On Leave';
}

export interface coordinator {
  id : string;
  name : string;
  email: string;
}

export interface WorkProof {
  proofId: string;
  complaintId: string;
  mechanicId: string;
  imageUrls?: string[];
  notes: string;
  createdAt: Date | string;
}

export interface Status {
  status: string;
  updatedAt: Date | string;
  updatedBy: string;
  isDeleted?: boolean;
}

export interface RejectReason {
  success: any;
  reasonId: string;
  complaintId: string;
  mechanicId: string;
  reason: string;
  createdAt: Date | string;
}

export interface NotificationMessage {
  id: string;
  type: 'new_complaint' | 'status_update' | 'assignment' | 'rejection' | 'acceptance';
  title: string;
  message: string;
  complaintId: string;
  timestamp: Date | string;
  read: boolean;
  recipientId: string;
}
