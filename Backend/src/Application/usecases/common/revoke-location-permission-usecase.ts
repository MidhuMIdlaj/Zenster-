import { inject, injectable } from 'inversify';
import { ILocationRepository } from '../../../domain/Repository/i-location-repository';
import { TYPES } from '../../../types';
import { IRevokeLocationPermissionUseCase } from '../../interface/common/revoke-location-permission-usecase-interface';

@injectable()
export class RevokeLocationPermissionUseCase implements IRevokeLocationPermissionUseCase {
  constructor(
    @inject(TYPES.ILocationRepository) private readonly locationRepository: ILocationRepository
  ) {}

  execute(employeeId: string): Promise<any> {
    return this.locationRepository.revokePermission(employeeId);
  }
}