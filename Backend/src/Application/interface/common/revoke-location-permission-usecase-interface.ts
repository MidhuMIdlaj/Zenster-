export interface IRevokeLocationPermissionUseCase {
  execute(employeeId: string): Promise<any>;
}