import { NextFunction, Request, Response } from 'express';
import { StatusCode } from '../../../shared/enums/statusCode';
import { sendError, sendSuccess } from '../../../shared/response';
import { injectable } from 'inversify';
import { LocationRepository } from '../../../infrastructure/repositories/location-repository';
import { LocationValidationService } from '../../../infrastructure/Services/location-validation-service';

@injectable()
export default class LocationController {
  private locationRepository: LocationRepository;

  constructor() {
    this.locationRepository = new LocationRepository();
  }

  /**
   * Track employee location
   * POST /api/location/track
   */
  trackLocation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { latitude, longitude, accuracy, provider } = req.body;
      // Get employeeId from authenticated user (set by verifyToken middleware)
      const authReq = req as Request & { user?: { userId?: string }; employee?: { id?: string } };
      const employeeId = authReq.user?.userId || authReq.employee?.id;

      if (!employeeId) {
        sendError(res, 'Employee not authenticated', StatusCode.UNAUTHORIZED);
        return;
      }

      // Validate coordinates
      const coordinateValidation = LocationValidationService.validateCoordinates(
        latitude,
        longitude
      );
      if (!coordinateValidation.valid) {
        sendError(res, coordinateValidation.error ?? 'Invalid coordinates', StatusCode.BAD_REQUEST);
        return;
      }

      // Validate accuracy
      if (!LocationValidationService.validateAccuracy(accuracy)) {
        sendError(res, 'Invalid accuracy (must be between 0 and 5000 meters)', StatusCode.BAD_REQUEST);
        return;
      }

      // Check if employee has permission
      const hasPermission = await this.locationRepository.hasPermission(employeeId);
      if (!hasPermission) {
        sendError(res, 'Employee has not granted tracking permission', StatusCode.FORBIDDEN);
        return;
      }

      // Get previous location for realistic movement validation
      const previousLocation = await this.locationRepository.getCurrentLocation(employeeId);

      if (previousLocation) {
        const movementValidation = LocationValidationService.validateLocationRealistic(
          {
            latitude: previousLocation.latitude,
            longitude: previousLocation.longitude,
            timestamp: previousLocation.timestamp,
          },
          {
            latitude,
            longitude,
            timestamp: new Date(),
          }
        );

        if (!movementValidation.valid) {
          sendError(res, movementValidation.reason ?? 'Unrealistic movement detected', StatusCode.BAD_REQUEST);
          return;
        }
      }

      // Get address
      const address = await LocationValidationService.getAddressFromCoordinates(
        latitude,
        longitude
      );

      // Save location
      const savedLocation = await this.locationRepository.saveLocation({
        employeeId,
        latitude,
        longitude,
        accuracy,
        address: address || undefined,
        provider: provider || 'browser-geolocation',
      });

      // Update last tracking time
      await this.locationRepository.updateLastTrackingTime(employeeId);

      sendSuccess(res, savedLocation, 'Location tracked successfully', StatusCode.OK);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get location history for employee
   * GET /api/location/history/:employeeId?hours=24
   */
  getLocationHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeeId } = req.params;
      const hours = parseInt(req.query.hours as string) || 24;

      const history = await this.locationRepository.getLocationHistory(employeeId, hours);

      sendSuccess(res, {
        employeeId,
        hoursBack: hours,
        totalLocations: history.length,
        locations: history,
      }, 'Location history retrieved successfully', StatusCode.OK);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get current location of employee
   * GET /api/location/current/:employeeId
   */
  getCurrentLocation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeeId } = req.params;

      const currentLocation = await this.locationRepository.getCurrentLocation(employeeId);

      if (!currentLocation) {
        sendError(res, 'No location found for this employee', StatusCode.NOT_FOUND);
        return;
      }

      sendSuccess(res, currentLocation, 'Current location retrieved successfully', StatusCode.OK);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get current locations of all active employees
   * GET /api/location/all-current
   */
  getAllCurrentLocations = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const locations = await this.locationRepository.getCurrentLocationsOfAllEmployees();
      sendSuccess(res, { totalLocations: locations.length, locations }, 'All current locations retrieved successfully', StatusCode.OK);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Grant location tracking permission
   * POST /api/location/permission/grant
   */
  grantPermission = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get employeeId from authenticated user (set by verifyToken middleware)
      const authReq = req as Request & { user?: { userId?: string }; employee?: { id?: string } };
      const employeeId = authReq.user?.userId || authReq.employee?.id;
      if (!employeeId) {
        sendError(res, 'Employee not authenticated', StatusCode.UNAUTHORIZED);
        return;
      }

      const permission = await this.locationRepository.grantPermission(employeeId);
      sendSuccess(res, permission, 'Location tracking permission granted', StatusCode.OK);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Revoke location tracking permission
   * POST /api/location/permission/revoke
   */
  revokePermission = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get employeeId from authenticated user (set by verifyToken middleware)
      const authReq = req as Request & { user?: { userId?: string }; employee?: { id?: string } };
      const employeeId = authReq.user?.userId || authReq.employee?.id;

      if (!employeeId) {
        sendError(res, 'Employee not authenticated', StatusCode.UNAUTHORIZED);
        return;
      }

      const permission = await this.locationRepository.revokePermission(employeeId);

      sendSuccess(res, permission, 'Location tracking permission revoked', StatusCode.OK);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get permission status
   * GET /api/location/permission/status
   */
  getPermissionStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get employeeId from authenticated user (set by verifyToken middleware)
      const authReq = req as Request & { user?: { userId?: string }; employee?: { id?: string } };
      const employeeId = authReq.user?.userId || authReq.employee?.id;
      if (!employeeId) {
        sendError(res, 'Employee not authenticated', StatusCode.UNAUTHORIZED);
        return;
      }

      const permission = await this.locationRepository.getPermissionStatus(employeeId);

      sendSuccess(res, permission, 'Permission status retrieved successfully', StatusCode.OK);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get location statistics
   * GET /api/location/statistics/:employeeId?hours=24
   */
  getLocationStatistics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeeId } = req.params;
      const hours = parseInt(req.query.hours as string) || 24;

      const statistics = await this.locationRepository.getLocationStatistics(employeeId, hours);

      sendSuccess(res, statistics, 'Location statistics retrieved successfully', StatusCode.OK);
    } catch (error) {
      next(error);
    }
  };
}
