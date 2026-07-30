
export interface SoftDeleteEmployeeInput {
  employeeId: string;
}

export interface SoftDeleteEmployeeOutput {
  success: boolean;
  data?: unknown;
  message: string;
  statusCode: number;
}
