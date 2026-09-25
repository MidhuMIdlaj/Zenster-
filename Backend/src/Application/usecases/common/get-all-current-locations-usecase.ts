import { inject, injectable } from 'inversify';
import { ILocationRepository } from '../../../domain/Repository/i-location-repository';
import { TYPES } from '../../../types';
import { IGetAllCurrentLocationsUseCase } from '../../interface/common/get-all-current-locations-usecase-interface';

@injectable()
export class GetAllCurrentLocationsUseCase implements IGetAllCurrentLocationsUseCase {
  constructor(
    @inject(TYPES.ILocationRepository) private readonly locationRepository: ILocationRepository
  ) {}

  execute(): Promise<Record<string, unknown>[]> {
    return this.locationRepository.getCurrentLocationsOfAllEmployees();
  }
}