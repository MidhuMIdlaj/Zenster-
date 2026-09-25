export interface IGetLocationStatisticsUseCase {
  execute(employeeId: string, hours: number): Promise<any>;
}