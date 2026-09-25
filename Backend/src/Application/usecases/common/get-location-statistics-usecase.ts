import { inject, injectable } from 'inversify';
import { ILocationRepository } from '../../../domain/Repository/i-location-repository';
import { TYPES } from '../../../types';
import { IGetLocationStatisticsUseCase } from '../../interface/common/get-location-statistics-usecase-interface';

@injectable()
export class GetLocationStatisticsUseCase implements IGetLocationStatisticsUseCase {
  constructor(
    @inject(TYPES.ILocationRepository) private readonly locationRepository: ILocationRepository
  ) {}

  execute(employeeId: string, hours: number): Promise<any> {
    return this.locationRepository.getLocationStatistics(employeeId, hours);
  }
}