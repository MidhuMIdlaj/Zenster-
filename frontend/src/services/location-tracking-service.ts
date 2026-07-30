import { LocationApiService, LocationData } from '../api/locationService';

export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
}

export interface TrackingState {
  isTracking: boolean;
  hasPermission: boolean;
  lastLocation?: GeolocationCoordinates;
  lastError?: string;
  updateInterval: number; // in milliseconds
  failureCount: number;
  maxRetries: number;
}

export class LocationTrackingService {
  private static instance: LocationTrackingService;
  private trackingState: TrackingState;
  private trackingIntervalId: any = null;
  private permissionCheckIntervalId: any = null;
  private statusCallbacks: Set<(state: TrackingState) => void> = new Set();
  private geolocationWatchId: number | null = null;

  private constructor() {
    this.trackingState = {
      isTracking: false,
      hasPermission: false,
      updateInterval: 3 * 60 * 1000, // 3 minutes default
      failureCount: 0,
      maxRetries: 3,
    };
  }

  /**
   * Get singleton instance
   */
  static getInstance(): LocationTrackingService {
    if (!LocationTrackingService.instance) {
      LocationTrackingService.instance = new LocationTrackingService();
    }
    return LocationTrackingService.instance;
  }

  private hasEmployeeSession(): boolean {
    try {
      const employeeData = JSON.parse(localStorage.getItem('employeeData') || '{}');
      return Boolean(employeeData?.token && employeeData?.id);
    } catch {
      return false;
    }
  }

  /**
   * Check if browser supports geolocation
   */
  static isSupported(): boolean {
    return 'geolocation' in navigator;
  }

  /**
   * Check if geolocation permission is granted
   */
  static async checkPermissionStatus(): Promise<boolean> {
    try {
      if (!('permissions' in navigator)) {
        console.warn('Permissions API not supported');
        return false;
      }

      const permission = await navigator.permissions.query({
        name: 'geolocation',
      });

      return permission.state === 'granted';
    } catch (error) {
      console.error('Error checking geolocation permission:', error);
      return false;
    }
  }

  /**
   * Request geolocation permission from user
   */
  static requestPermission(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!LocationTrackingService.isSupported()) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        () => {
          resolve();
        },
        (error) => {
          reject(new Error(`Geolocation permission denied: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }

  /**
   * Get current position
   */
  static getCurrentPosition(): Promise<GeolocationCoordinates> {
    return new Promise((resolve, reject) => {
      if (!LocationTrackingService.isSupported()) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || undefined,
            altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
          });
        },
        (error) => {
          reject(new Error(`Failed to get current position: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }

  /**
   * Watch position (continuous updates)
   */
  watchPosition(
    onSuccess: (coords: GeolocationCoordinates) => void,
    onError?: (error: string) => void
  ): number {
    if (!LocationTrackingService.isSupported()) {
      if (onError) onError('Geolocation is not supported');
      return -1;
    }

    this.geolocationWatchId = navigator.geolocation.watchPosition(
      (position) => {
        this.trackingState.lastLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || undefined,
          altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined,
        };
        onSuccess(this.trackingState.lastLocation);
      },
      (error) => {
        if (onError) onError(error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return this.geolocationWatchId;
  }

  /**
   * Clear position watch
   */
  clearWatch(watchId: number): void {
    if (watchId !== -1) {
      navigator.geolocation.clearWatch(watchId);
    }
  }

  /**
   * Start location tracking
   * Sends location to backend at specified intervals
   */
  async startTracking(
    updateIntervalMs: number = 3 * 60 * 1000, // 3 minutes
    onLocationSent?: (success: boolean, error?: string) => void
  ): Promise<void> {
    if (!this.hasEmployeeSession()) {
      await this.stopTracking();
      return;
    }

    if (!LocationTrackingService.isSupported()) {
      throw new Error('Geolocation is not supported by this browser');
    }

    if (this.trackingState.isTracking) {
      console.warn('Tracking already in progress');
      return;
    }

    this.trackingState.isTracking = true;
    this.trackingState.updateInterval = updateIntervalMs;
    this.trackingState.failureCount = 0;

    this.notifyStatusChange();

    // Initial location send
    await this.sendLocationToBackend(onLocationSent);

    // Set up periodic tracking
    this.trackingIntervalId = setInterval(async () => {
      if (!this.hasEmployeeSession()) {
        await this.stopTracking();
        return;
      }

      await this.sendLocationToBackend(onLocationSent);
    }, updateIntervalMs);
  }

  /**
   * Stop location tracking
   */
  async stopTracking(): Promise<void> {
    if (this.trackingIntervalId) {
      clearInterval(this.trackingIntervalId);
      this.trackingIntervalId = null;
    }

    if (this.geolocationWatchId !== null) {
      this.clearWatch(this.geolocationWatchId);
      this.geolocationWatchId = null;
    }

    this.trackingState.isTracking = false;
    this.trackingState.failureCount = 0;

    this.notifyStatusChange();
  }

  /**
   * Send location to backend
   */
  private async sendLocationToBackend(
    callback?: (success: boolean, error?: string) => void
  ): Promise<void> {
    try {
      if (!this.hasEmployeeSession()) {
        await this.stopTracking();
        return;
      }

      // Get current position
      const position = await LocationTrackingService.getCurrentPosition();

      // Create location data
      const locationData: LocationData = {
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy,
        provider: 'browser-geolocation',
      };

      // Send to backend
      await LocationApiService.trackLocation(locationData);
      // Reset failure count on success
      this.trackingState.failureCount = 0;
      this.trackingState.lastLocation = position;
      this.trackingState.lastError = undefined;

      if (callback) callback(true);
      this.notifyStatusChange();
    } catch (error) {
      this.trackingState.failureCount++;
      this.trackingState.lastError = error instanceof Error ? error.message : 'Unknown error';

      console.error('Failed to send location:', this.trackingState.lastError);

      // Check if we've exceeded max retries
      if (this.trackingState.failureCount >= this.trackingState.maxRetries) {
        console.error('Max retries exceeded. Stopping tracking.');
        await this.stopTracking();
      }

      if (callback) callback(false, this.trackingState.lastError);
      this.notifyStatusChange();
    }
  }

  /**
   * Subscribe to tracking state changes
   */
  onStateChange(callback: (state: TrackingState) => void): () => void {
    this.statusCallbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  /**
   * Notify all subscribers of state change
   */
  private notifyStatusChange(): void {
    this.statusCallbacks.forEach((callback) => {
      callback({ ...this.trackingState });
    });
  }

  /**
   * Get current tracking state
   */
  getState(): TrackingState {
    return { ...this.trackingState };
  }

  /**
   * Set tracking permission status
   */
  setPermissionStatus(hasPermission: boolean): void {
    this.trackingState.hasPermission = hasPermission;
    this.notifyStatusChange();
  }

  /**
   * Get update interval in seconds (for display)
   */
  getUpdateIntervalSeconds(): number {
    return Math.round(this.trackingState.updateInterval / 1000);
  }

  /**
   * Set update interval
   */
  setUpdateInterval(intervalSeconds: number): void {
    const intervalMs = intervalSeconds * 1000;

    if (this.trackingState.isTracking) {
      // Stop and restart with new interval
      if (this.trackingIntervalId) {
        clearInterval(this.trackingIntervalId);
        this.trackingState.updateInterval = intervalMs;

        this.trackingIntervalId = setInterval(async () => {
          await this.sendLocationToBackend();
        }, intervalMs);
      }
    } else {
      this.trackingState.updateInterval = intervalMs;
    }

    this.notifyStatusChange();
  }

  /**
   * Get failure count
   */
  getFailureCount(): number {
    return this.trackingState.failureCount;
  }

  /**
   * Get last error
   */
  getLastError(): string | undefined {
    return this.trackingState.lastError;
  }

  /**
   * Reset error state
   */
  resetError(): void {
    this.trackingState.lastError = undefined;
    this.notifyStatusChange();
  }
}
