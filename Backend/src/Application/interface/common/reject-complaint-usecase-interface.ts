export interface IRejectComplaintUseCase {
  execute(
    complaintId: string,
    mechanicId: string,
    reason: string
  ): Promise<{
    success: boolean;
    message: string;
    complaint?: unknown;
    currentStatus?: string;
  }>;
}
