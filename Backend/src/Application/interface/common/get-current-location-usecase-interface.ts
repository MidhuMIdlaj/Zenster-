import { Location } from '../../../domain/entities/Location';

export interface IGetCurrentLocationUseCase {
  execute(employeeId: string): Promise<Location | null>;
}