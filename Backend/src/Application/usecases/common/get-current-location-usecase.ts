import { inject, injectable } from 'inversify';
import { ILocationRepository } from '../../../domain/Repository/i-location-repository';
import { TYPES } from '../../../types';
import { IGetCurrentLocationUseCase } from '../../interface/common/get-current-location-usecase-interface';
import { Location } from '../../../domain/entities/Location';

@injectable()
export class GetCurrentLocationUseCase implements IGetCurrentLocationUseCase {
  constructor(
    @inject(TYPES.ILocationRepository) private readonly locationRepository: ILocationRepository
  ) {}

  execute(employeeId: string): Promise<Location | null> {
    return this.locationRepository.getCurrentLocation(employeeId);
  }
}