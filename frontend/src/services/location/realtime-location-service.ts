/**
 * Real-time Location Service
 * Handles polling or WebSocket updates for real-time employee locations
 */

import { LocationApiService } from '../../api/locationService';
import { EmployeeLocationWithStatus, RealTimeLocationUpdate } from '../../types/location-types';

export class RealTimeLocationService {
  private static instance: RealTimeLocationService;
  private pollingIntervalId: number | null = null;
  private updateCallbacks: Set<(updates: EmployeeLocationWithStatus[]) => void> = new Set();
  private isPolling: boolean = false;
  private pollingInterval: number = 30000; // 30 seconds default
  private lastUpdateTime: Map<string, Date> = new Map();

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): RealTimeLocationService {
    if (!RealTimeLocationService.instance) {
      RealTimeLocationService.instance = new RealTimeLocationService();
    }
    return RealTimeLocationService.instance;
  }

  /**
   * Start polling for real-time updates
   */
  startPolling(intervalMs: number = 30000): void {
    if (this.isPolling) {
      console.warn('Polling already started');
      return;
    }

    this.isPolling = true;
    this.pollingInterval = intervalMs;

    // Initial fetch
    this.fetchAllLocations();

    // Set up interval
    this.pollingIntervalId = window.setInterval(() => {
      this.fetchAllLocations();
    }, intervalMs);

  }

  /**
   * Stop polling
   */
  stopPolling(): void {
    if (this.pollingIntervalId) {
      clearInterval(this.pollingIntervalId);
      this.pollingIntervalId = null;
    }

    this.isPolling = false;
  }

  /**
   * Fetch all employee locations
   */
  private async fetchAllLocations(): Promise<void> {
    try {
      const response = await LocationApiService.getAllCurrentLocations();

      if (response?.data?.locations) {
        const locations: EmployeeLocationWithStatus[] = response.data.locations.map(
          (loc: any) => ({
            employeeId: loc.employeeId,
            employeeName: loc.employeeName,
            latitude: loc.latitude,
            longitude: loc.longitude,
            accuracy: loc.accuracy,
            address: loc.address,
            timestamp: new Date(loc.lastUpdate),
            trackingEnabled: loc.trackingEnabled,
            lastUpdate: new Date(loc.lastUpdate),
            status: loc.status,
          })
        );

        this.notifySubscribers(locations);
      }
    } catch (error) {
      console.error('Error fetching real-time locations:', error);
    }
  }

  /**
   * Subscribe to location updates
   */
  onLocationsUpdated(
    callback: (locations: EmployeeLocationWithStatus[]) => void
  ): () => void {
    this.updateCallbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.updateCallbacks.delete(callback);
    };
  }

  /**
   * Notify all subscribers
   */
  private notifySubscribers(locations: EmployeeLocationWithStatus[]): void {
    this.updateCallbacks.forEach((callback) => {
      try {
        callback(locations);
      } catch (error) {
        console.error('Error in location update callback:', error);
      }
    });
  }

  /**
   * Get locations for specific employee
   */
  async getEmployeeLocationHistory(
    employeeId: string,
    hours: number = 24
  ): Promise<EmployeeLocationWithStatus[]> {
    try {
      const response = await LocationApiService.getLocationHistory(employeeId, hours);

      if (response?.data?.locations) {
        return response.data.locations.map((loc: any) => ({
          employeeId: loc.employeeId,
          latitude: loc.latitude,
          longitude: loc.longitude,
          accuracy: loc.accuracy,
          address: loc.address,
          timestamp: new Date(loc.timestamp),
          trackingEnabled: true,
          lastUpdate: new Date(loc.timestamp),
          status: 'active',
        }));
      }

      return [];
    } catch (error) {
      console.error('Error fetching location history:', error);
      return [];
    }
  }

  /**
   * Get current location of employee
   */
  async getEmployeeCurrentLocation(employeeId: string): Promise<EmployeeLocationWithStatus | null> {
    try {
      const response = await LocationApiService.getCurrentLocation(employeeId);

      if (response?.data) {
        return {
          employeeId: response.data.employeeId,
          latitude: response.data.latitude,
          longitude: response.data.longitude,
          accuracy: response.data.accuracy,
          address: response.data.address,
          timestamp: new Date(response.data.timestamp),
          trackingEnabled: true,
          lastUpdate: new Date(response.data.timestamp),
          status: 'active',
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching current location:', error);
      return null;
    }
  }

  /**
   * Get location statistics
   */
  async getLocationStatistics(employeeId: string, hours: number = 24) {
    try {
      const response = await LocationApiService.getLocationStatistics(employeeId, hours);
      return response?.data;
    } catch (error) {
      console.error('Error fetching location statistics:', error);
      return null;
    }
  }

  /**
   * Check if employee moved since last check
   */
  hasMoved(
    employeeId: string,
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
    thresholdMeters: number = 10
  ): boolean {
    const R = 6371000; // Earth's radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in meters

    return distance >= thresholdMeters;
  }

  /**
   * Set polling interval
   */
  setPollingInterval(intervalMs: number): void {
    if (this.isPolling) {
      this.stopPolling();
      this.startPolling(intervalMs);
    } else {
      this.pollingInterval = intervalMs;
    }
  }

  /**
   * Get polling status
   */
  isPollingActive(): boolean {
    return this.isPolling;
  }

  /**
   * Get current polling interval
   */
  getPollingInterval(): number {
    return this.pollingInterval;
  }

  /**
   * Get subscriber count
   */
  getSubscriberCount(): number {
    return this.updateCallbacks.size;
  }
}
