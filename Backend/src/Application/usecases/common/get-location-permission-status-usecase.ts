import { inject, injectable } from 'inversify';
import { ILocationRepository } from '../../../domain/Repository/i-location-repository';
import { TYPES } from '../../../types';
import { IGetLocationPermissionStatusUseCase } from '../../interface/common/get-location-permission-status-usecase-interface';

@injectable()
export class GetLocationPermissionStatusUseCase implements IGetLocationPermissionStatusUseCase {
  constructor(
    @inject(TYPES.ILocationRepository) private readonly locationRepository: ILocationRepository
  ) {}

  execute(employeeId: string): Promise<any> {
    return this.locationRepository.getPermissionStatus(employeeId);
  }
}