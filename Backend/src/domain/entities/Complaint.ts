
export type MechanicAssignment = {
  mechanicId: string;
  status: 'accept' | 'reject' | 'pending';
  reason?: string | null;
};

export type CompletionDetails = {
  description: string;
  photos: string[];
  completedAt: Date | string;
  completedBy: string;
  paymentStatus?: string;
  amount?: number;
  paymentMethod?: string;
};

export default class ServiceRequest {
  constructor(
    public id: string,
    public complaintNumber: number,
    public customerEmail: string,
    public contactNumber: string,
    public description: string,
    public assignedMechanicId: MechanicAssignment[],
    public createdBy: string,
    public status: 'active' | 'completed' | 'cancelled' | 'on-hold' = 'active',
    public priority: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    public customerName: string,
    public notes: string = '',
    public productName: string,
    public address: string,
    public model: string,
    public guaranteeDate: Date | string,
    public warrantyDate: Date | string,
    public CreatedByRole: 'admin' | 'technician' | 'customer',
    public createdAt: Date | string = new Date(),
    public updatedAt: Date | string = new Date(),
    public workingStatus: 'pending' | 'in-progress' | 'completed' | 'rejected' = 'pending',
    public rejectionReason?: string,
    public isDeleted: boolean = false,
    public completionDetails?: CompletionDetails
  ) {}
}