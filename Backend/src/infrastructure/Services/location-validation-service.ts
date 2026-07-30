import axios from 'axios';
import { environment } from '../../config/environment';

export class LocationValidationService {
  /**
   * Validate location coordinates
   * Check if coordinates are within valid ranges
   */
  static validateCoordinates(
    latitude: number,
    longitude: number
  ): { valid: boolean; error?: string } {
    // Latitude range: -90 to 90
    // Longitude range: -180 to 180

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return { valid: false, error: 'Coordinates must be numbers' };
    }

    if (latitude < -90 || latitude > 90) {
      return { valid: false, error: 'Invalid latitude (must be between -90 and 90)' };
    }

    if (longitude < -180 || longitude > 180) {
      return { valid: false, error: 'Invalid longitude (must be between -180 and 180)' };
    }

    return { valid: true };
  }

  /**
   * Reverse geocode to get address from coordinates
   * Uses Google Maps Geocoding API
   */
  static async getAddressFromCoordinates(
    latitude: number,
    longitude: number
  ): Promise<string | null> {
    try {
      const apiKey = environment.getConfig().googleMapsApiKey;

      if (!apiKey) {
        console.warn('Google Maps API key not configured');
        return null;
      }

      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json`,
        {
          params: {
            latlng: `${latitude},${longitude}`,
            key: apiKey,
          },
        }
      );

      if (
        response.data.results &&
        response.data.results.length > 0
      ) {
        return response.data.results[0].formatted_address;
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  /**
   * Check if location is realistic (not teleporting too fast)
   */
  static validateLocationRealistic(
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
  ): { valid: boolean; reason?: string } {
    try {
      const distance = this.calculateDistance(
        previousLocation.latitude,
        previousLocation.longitude,
        currentLocation.latitude,
        currentLocation.longitude
      );

      const timeDiffMinutes =
        (currentLocation.timestamp.getTime() -
          previousLocation.timestamp.getTime()) /
        (1000 * 60);

      // Max speed: 250 km/h (realistic for vehicles, including flights)
      const maxDistance = (250 * timeDiffMinutes) / 60; // km

      if (distance > maxDistance) {
        return {
          valid: false,
          reason: `Location change too fast: ${distance.toFixed(2)}km in ${timeDiffMinutes.toFixed(1)}min (max: ${maxDistance.toFixed(2)}km)`,
        };
      }

      return { valid: true };
    } catch (error) {
      console.error('Location validation error:', error);
      return { valid: false, reason: 'Validation error' };
    }
  }

  /**
   * Haversine formula to calculate distance between two points
   * Returns distance in kilometers
   */
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  /**
   * Get last known location of employee
   */
  static async getLastKnownLocation(employeeId: string) {
    // This will be implemented with repository pattern
    return null;
  }

  /**
   * Validate accuracy is reasonable
   */
  static validateAccuracy(accuracy: number): boolean {
    // Accuracy in meters - should be between 0 and 5000m (5km)
    return accuracy >= 0 && accuracy <= 5000;
  }

  /**
   * Check if coordinates are in a geofence
   */
  static isLocationInGeofence(
    latitude: number,
    longitude: number,
    centerLat: number,
    centerLon: number,
    radiusKm: number
  ): boolean {
    const distance = this.calculateDistance(latitude, longitude, centerLat, centerLon);
    return distance <= radiusKm;
  }
}
