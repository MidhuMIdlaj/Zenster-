import {
  inject,
  injectable
} from "inversify";
import { ITrackLocationUseCase } from "../../interface/common/track-location-usecase-interface";
import { TYPES } from "../../../types";
import { ILocationRepository, ILocationValidationService } from "../../../domain/Repository/i-location-repository";
import { TrackLocationDTO } from "../../../domain/dtos/Location/track-location-usecase-interface";
import { Location } from "../../../domain/entities/Location";
import { AppError } from "../../../domain/error/employeeErrors";
import { StatusCode } from "../../../shared/enums/statusCode";


@injectable()
export class TrackLocationUseCase
  implements ITrackLocationUseCase {

  constructor(

    @inject(TYPES.ILocationRepository)
    private readonly locationRepository:
      ILocationRepository,

    @inject(TYPES.ILocationValidationService)
    private readonly validationService:
      ILocationValidationService

  ) {}


  async execute(
    data: TrackLocationDTO
  ): Promise<Location> {

    const {
      employeeId,
      latitude,
      longitude,
      accuracy,
      provider
    } = data;


    // 1. Validate coordinates

    const coordinateValidation =
      this.validationService.validateCoordinates(
        latitude,
        longitude
      );

    if (!coordinateValidation.valid) {

      throw new AppError(
        coordinateValidation.error ??
        "Invalid coordinates",
        StatusCode.BAD_REQUEST
      );
    }


    // 2. Validate accuracy

    const validAccuracy =
      this.validationService.validateAccuracy(
        accuracy
      );

    if (!validAccuracy) {

      throw new AppError(
        "Invalid accuracy (must be between 0 and 5000 meters)",
        StatusCode.BAD_REQUEST
      );
    }


    // 3. Check permission

    const hasPermission =
      await this.locationRepository.hasPermission(
        employeeId
      );

    if (!hasPermission) {

      throw new AppError(
        "Employee has not granted tracking permission",
        StatusCode.FORBIDDEN
      );
    }


    // 4. Get previous location

    const previousLocation =
      await this.locationRepository.getCurrentLocation(
        employeeId
      );


    // 5. Validate movement

    if (previousLocation) {

      const movementValidation =
        this.validationService.validateLocationRealistic(
          {
            latitude: previousLocation.latitude,
            longitude: previousLocation.longitude,
            timestamp: previousLocation.timestamp
          },
          {
            latitude,
            longitude,
            timestamp: new Date()
          }
        );


      if (!movementValidation.valid) {

        throw new AppError(
          movementValidation.reason ??
          "Unrealistic movement detected",
          StatusCode.BAD_REQUEST
        );
      }
    }


    // 6. Get address

    const address =
      await this.validationService
        .getAddressFromCoordinates(
          latitude,
          longitude
        );


    // 7. Save location

    const savedLocation =
      await this.locationRepository.saveLocation({

        employeeId,

        latitude,

        longitude,

        accuracy,

        address:
          address || undefined,

        provider:
          provider ||
          "browser-geolocation"

      });


    // 8. Update tracking time

    await this.locationRepository
      .updateLastTrackingTime(
        employeeId
      );


    return savedLocation;
  }
}