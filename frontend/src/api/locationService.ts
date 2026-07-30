import axiosInstance from './axiosInstance';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  provider?: string;
}

export interface TrackLocationResponse {
  message: string;
  data: {
    _id: string;
    employeeId: string;
    latitude: number;
    longitude: number;
    accuracy: number;
    address?: string;
    timestamp: string;
    provider: string;
  };
}

export interface LocationHistoryResponse {
  message: string;
  data: {
    employeeId: string;
    hoursBack: number;
    totalLocations: number;
    locations: any[];
  };
}

export interface PermissionResponse {
  message: string;
  data: {
    _id: string;
    employeeId: string;
    trackingEnabled: boolean;
    grantedAt?: string;
    revokedAt?: string;
    lastTrackingUpdate?: string;
  };
}

export interface LocationStatisticsResponse {
  message: string;
  data: {
    totalLocations: number;
    distance: number;
    averageAccuracy: number;
    firstLocation: any;
    lastLocation: any;
    hoursBack: number;
  };
}

export class LocationApiService {
  /**
   * Track employee location
   */
  static async trackLocation(locationData: LocationData): Promise<TrackLocationResponse> {
    try {
      const response = await axiosInstance.post<TrackLocationResponse>(
        '/location/track',
        locationData
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get current location of employee
   */
  static async getCurrentLocation(employeeId: string) {
    try {
      const response = await axiosInstance.get(
        `/location/current/${employeeId}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get location history
   */
  static async getLocationHistory(
    employeeId: string,
    hours: number = 24
  ): Promise<LocationHistoryResponse> {
    try {
      const response = await axiosInstance.get<LocationHistoryResponse>(
        `/location/history/${employeeId}`,
        { params: { hours } }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get all current locations (admin/coordinator only)
   */
  static async getAllCurrentLocations() {
    try {
      const response = await axiosInstance.get(
        '/location/all-current'
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get location statistics
   */
  static async getLocationStatistics(
    employeeId: string,
    hours: number = 24
  ): Promise<LocationStatisticsResponse> {
    try {
      const response = await axiosInstance.get<LocationStatisticsResponse>(
        `/location/statistics/${employeeId}`,
        { params: { hours } }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Grant location tracking permission
   */
  static async grantPermission(): Promise<PermissionResponse> {
    try {
      const response = await axiosInstance.post<PermissionResponse>(
        '/location/permission/grant'
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Revoke location tracking permission
   */
  static async revokePermission(): Promise<PermissionResponse> {
    try {
      const response = await axiosInstance.post<PermissionResponse>(
        '/location/permission/revoke'
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get permission status
   */
  static async getPermissionStatus() {
    try {
      const response = await axiosInstance.get(
        '/location/permission/status'
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors
   */
  private static handleError(error: any): Error {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }
    if (error.message) {
      return new Error(error.message);
    }
    return new Error('An error occurred with the location API');
  }
}
