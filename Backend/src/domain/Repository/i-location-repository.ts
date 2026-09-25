import { Location } from "../entities/Location";

export interface ILocationRepository {

  hasPermission(employeeId: string): Promise<boolean>;

  getCurrentLocation(
    employeeId: string
  ): Promise<Location | null>;

  saveLocation(data: {
    employeeId: string;
    latitude: number;
    longitude: number;
    accuracy: number;
    address?: string;
    provider: string;
  }): Promise<Location>;

  updateLastTrackingTime(
    employeeId: string
  ): Promise<void>;

  getLocationHistory(
    employeeId: string,
    hours: number
  ): Promise<Location[]>;

  getCurrentLocationsOfAllEmployees(): Promise<Record<string, unknown>[]>;

  grantPermission(
    employeeId: string
  ): Promise<any>;

  revokePermission(
    employeeId: string
  ): Promise<any>;

  getPermissionStatus(
    employeeId: string
  ): Promise<any>;

  getLocationStatistics(
    employeeId: string,
    hours: number
  ): Promise<any>;
}


export interface ILocationValidationService {

  validateCoordinates(
    latitude: number,
    longitude: number
  ): {
    valid: boolean;
    error?: string;
  };

  validateAccuracy(
    accuracy: number
  ): boolean;

  validateLocationRealistic(
    previousLocation: {
      latitude: number;
      longitude: number;
      timestamp: Date;
    },
    currentLocation: {
      latitude: number;
      longitude: number;
      timestamp: Date;
    }
  ): {
    valid: boolean;
    reason?: string;
  };

  getAddressFromCoordinates(
    latitude: number,
    longitude: number
  ): Promise<string | null>;

  isLocationInGeofence(
    latitude: number,
    longitude: number,
    centerLat: number,
    centerLon: number,
    radiusKm: number
  ): boolean;
}