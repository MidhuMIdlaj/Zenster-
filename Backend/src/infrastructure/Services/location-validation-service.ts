import axios from 'axios';
import { environment } from '../../config/environment';
import { ILocationValidationService } from '../../domain/Repository/i-location-repository';
import { injectable } from 'inversify';

@injectable()
export class LocationValidationService implements ILocationValidationService {
  validateCoordinates(
    latitude: number,
    longitude: number
  ): { valid: boolean; error?: string } {
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

  async getAddressFromCoordinates(
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
  ): { valid: boolean; reason?: string } {
    try {
      const distance = LocationValidationService.calculateDistance(
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


  static async getLastKnownLocation(employeeId: string) {
    // This will be implemented with repository pattern
    return null;
  }

 
  validateAccuracy(accuracy: number): boolean {
    // Accuracy in meters - should be between 0 and 5000m (5km)
    return accuracy >= 0 && accuracy <= 5000;
  }


  isLocationInGeofence(
    latitude: number,
    longitude: number,
    centerLat: number,
    centerLon: number,
    radiusKm: number
  ): boolean {
    const distance = LocationValidationService.calculateDistance(latitude, longitude, centerLat, centerLon);
    return distance <= radiusKm;
  }
}
