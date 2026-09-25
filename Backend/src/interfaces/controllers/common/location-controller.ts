import { NextFunction, Request, Response } from 'express';
import { StatusCode } from '../../../shared/enums/statusCode';
import { sendError, sendSuccess } from '../../../shared/response';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../../types';
import { AppError } from '../../../domain/error/employeeErrors';
import { ITrackLocationUseCase } from '../../../Application/interface/common/track-location-usecase-interface';
import { IGetLocationHistoryUseCase } from '../../../Application/interface/common/get-location-history-usecase-interface';
import { IGetCurrentLocationUseCase } from '../../../Application/interface/common/get-current-location-usecase-interface';
import { IGetAllCurrentLocationsUseCase } from '../../../Application/interface/common/get-all-current-locations-usecase-interface';
import { IGrantLocationPermissionUseCase } from '../../../Application/interface/common/grant-location-permission-usecase-interface';
import { IRevokeLocationPermissionUseCase } from '../../../Application/interface/common/revoke-location-permission-usecase-interface';
import { IGetLocationPermissionStatusUseCase } from '../../../Application/interface/common/get-location-permission-status-usecase-interface';
import { IGetLocationStatisticsUseCase } from '../../../Application/interface/common/get-location-statistics-usecase-interface';

@injectable()
export default class LocationController {
  constructor(
    @inject(TYPES.TrackLocationUseCase) private readonly trackLocationUseCase: ITrackLocationUseCase,
    @inject(TYPES.GetLocationHistoryUseCase) private readonly getLocationHistoryUseCase: IGetLocationHistoryUseCase,
    @inject(TYPES.GetCurrentLocationUseCase) private readonly getCurrentLocationUseCase: IGetCurrentLocationUseCase,
    @inject(TYPES.GetAllCurrentLocationsUseCase) private readonly getAllCurrentLocationsUseCase: IGetAllCurrentLocationsUseCase,
    @inject(TYPES.GrantLocationPermissionUseCase) private readonly grantLocationPermissionUseCase: IGrantLocationPermissionUseCase,
    @inject(TYPES.RevokeLocationPermissionUseCase) private readonly revokeLocationPermissionUseCase: IRevokeLocationPermissionUseCase,
    @inject(TYPES.GetLocationPermissionStatusUseCase) private readonly getLocationPermissionStatusUseCase: IGetLocationPermissionStatusUseCase,
    @inject(TYPES.GetLocationStatisticsUseCase) private readonly getLocationStatisticsUseCase: IGetLocationStatisticsUseCase
  ) {}
  
  trackLocation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { latitude, longitude, accuracy, provider } = req.body;
      const authReq = req as Request & { user?: { userId?: string }; employee?: { id?: string } };
      const employeeId = authReq.user?.userId || authReq.employee?.id;

      if (!employeeId) {
        sendError(res, 'Employee not authenticated', StatusCode.UNAUTHORIZED);
        return;
      }

      const savedLocation = await this.trackLocationUseCase.execute({
        employeeId,
        latitude,
        longitude,
        accuracy,
        provider,
      });

      sendSuccess(res, savedLocation, 'Location tracked successfully', StatusCode.OK);
    } catch (error) {
      if (error instanceof AppError) {
        sendError(res, error.message, error.statusCode as StatusCode);
        return;
      }
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

      const history = await this.getLocationHistoryUseCase.execute(employeeId, hours);

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

      const currentLocation = await this.getCurrentLocationUseCase.execute(employeeId);

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
      const locations = await this.getAllCurrentLocationsUseCase.execute();
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

      const permission = await this.grantLocationPermissionUseCase.execute(employeeId);
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

      const permission = await this.revokeLocationPermissionUseCase.execute(employeeId);

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

      const permission = await this.getLocationPermissionStatusUseCase.execute(employeeId);

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

      const statistics = await this.getLocationStatisticsUseCase.execute(employeeId, hours);

      sendSuccess(res, statistics, 'Location statistics retrieved successfully', StatusCode.OK);
    } catch (error) {
      next(error);
    }
  };
}
