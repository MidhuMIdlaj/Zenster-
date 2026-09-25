import { inject, injectable } from 'inversify';
import { ILocationRepository } from '../../../domain/Repository/i-location-repository';
import { TYPES } from '../../../types';
import { IGetLocationHistoryUseCase } from '../../interface/common/get-location-history-usecase-interface';
import { Location } from '../../../domain/entities/Location';

@injectable()
export class GetLocationHistoryUseCase implements IGetLocationHistoryUseCase {
  constructor(
    @inject(TYPES.ILocationRepository) private readonly locationRepository: ILocationRepository
  ) {}

  execute(employeeId: string, hours: number): Promise<Location[]> {
    return this.locationRepository.getLocationHistory(employeeId, hours);
  }
}