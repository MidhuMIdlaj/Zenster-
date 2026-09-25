export interface IGrantLocationPermissionUseCase {
  execute(employeeId: string): Promise<any>;
}