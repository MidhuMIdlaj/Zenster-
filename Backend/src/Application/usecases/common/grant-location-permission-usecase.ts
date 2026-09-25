import { inject, injectable } from 'inversify';
import { ILocationRepository } from '../../../domain/Repository/i-location-repository';
import { TYPES } from '../../../types';
import { IGrantLocationPermissionUseCase } from '../../interface/common/grant-location-permission-usecase-interface';

@injectable()
export class GrantLocationPermissionUseCase implements IGrantLocationPermissionUseCase {
  constructor(
    @inject(TYPES.ILocationRepository) private readonly locationRepository: ILocationRepository
  ) {}

  execute(employeeId: string): Promise<any> {
    return this.locationRepository.grantPermission(employeeId);
  }
}