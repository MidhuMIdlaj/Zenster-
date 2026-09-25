import { Location } from '../../../domain/entities/Location';

export interface IGetLocationHistoryUseCase {
  execute(employeeId: string, hours: number): Promise<Location[]>;
}