export interface IGetLocationPermissionStatusUseCase {
  execute(employeeId: string): Promise<any>;
}