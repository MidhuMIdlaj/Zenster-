import EmployeeLocation, { IEmployeeLocation } from '../db/models/employee-location.model';
import LocationPermission, { ILocationPermission } from '../db/models/location-permission.model';
import EmployeeModel from '../db/models/employee.model';
import { LocationValidationService } from '../Services/location-validation-service';

type UnknownRecord = Record<string, unknown>;

export class LocationRepository {
  /**
   * Save employee location
   */
  async saveLocation(locationData: {
    employeeId: string;
    latitude: number;
    longitude: number;
    accuracy: number;
    address?: string;
    provider?: string;
  }): Promise<IEmployeeLocation> {
    try {
      const newLocation = new EmployeeLocation({
        ...locationData,
        timestamp: new Date(),
      });

      return await newLocation.save();
    } catch (error) {
      throw new Error(`Failed to save location: ${error}`);
    }
  }

  /**
   * Get location history for employee
   */
  async getLocationHistory(
    employeeId: string,
    hoursBack: number = 24
  ): Promise<IEmployeeLocation[]> {
    try {
      const startDate = new Date();
      startDate.setHours(startDate.getHours() - hoursBack);

      return await EmployeeLocation.find({
        employeeId,
        timestamp: { $gte: startDate },
      })
        .sort({ timestamp: -1 })
        .lean();
    } catch (error) {
      throw new Error(`Failed to get location history: ${error}`);
    }
  }

  /**
   * Get current (latest) location of employee
   */
  async getCurrentLocation(employeeId: string): Promise<IEmployeeLocation | null> {
    try {
      return await EmployeeLocation.findOne({ employeeId })
        .sort({ timestamp: -1 })
        .lean();
    } catch (error) {
      throw new Error(`Failed to get current location: ${error}`);
    }
  }

  /**
   * Get current locations of all active employees
   */
  async getCurrentLocationsOfAllEmployees(): Promise<UnknownRecord[]> {
    try {
      // Get all employees with their latest location
      const employees = await EmployeeModel.find(
        { isDeleted: false, status: 'active' },
        { _id: 1, employeeName: 1 }
      ).lean();
      const locationsWithEmployees = await Promise.all(
        employees.map(async (employee: UnknownRecord) => {
          const latestLocation = await this.getCurrentLocation(String(employee._id));
          const permission = await this.getPermissionStatus(String(employee._id));
          return {
            employeeId: employee._id,
            employeeName: employee.employeeName,
            latitude: latestLocation?.latitude,
            longitude: latestLocation?.longitude,
            address: latestLocation?.address,
            lastUpdate: latestLocation?.timestamp,
            status: permission?.trackingEnabled ? 'active' : 'inactive',
            trackingEnabled: permission?.trackingEnabled,
          } as UnknownRecord;
        })
      );
      // Filter out employees without locations
      return locationsWithEmployees.filter((loc) => Boolean((loc as UnknownRecord).latitude && (loc as UnknownRecord).longitude));
    } catch (error) {
      throw new Error(`Failed to get all locations: ${error}`);
    }
  }

  /**
   * Grant location tracking permission
   */
  async grantPermission(employeeId: string): Promise<ILocationPermission> {
    try {
      const permission = await LocationPermission.findOneAndUpdate(
        { employeeId },
        {
          trackingEnabled: true,
          grantedAt: new Date(),
          revokedAt: null,
        },
        { upsert: true, new: true }
      );

      return permission!;
    } catch (error) {
      throw new Error(`Failed to grant permission: ${error}`);
    }
  }

  /**
   * Revoke location tracking permission
   */
  async revokePermission(employeeId: string): Promise<ILocationPermission> {
    try {
      const permission = await LocationPermission.findOneAndUpdate(
        { employeeId },
        {
          trackingEnabled: false,
          revokedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      return permission!;
    } catch (error) {
      throw new Error(`Failed to revoke permission: ${error}`);
    }
  }

  /**
   * Get permission status
   */
  async getPermissionStatus(employeeId: string): Promise<ILocationPermission | null> {
    try {
      return await LocationPermission.findOne({ employeeId }).lean();
    } catch (error) {
      throw new Error(`Failed to get permission status: ${error}`);
    }
  }

  /**
   * Check if employee has tracking permission
   */
  async hasPermission(employeeId: string): Promise<boolean> {
    try {
      const permission = await this.getPermissionStatus(employeeId);
      return permission?.trackingEnabled ?? false;
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  }

  /**
   * Update last tracking update timestamp
   */
  async updateLastTrackingTime(employeeId: string): Promise<void> {
    try {
      await LocationPermission.updateOne(
        { employeeId },
        { lastTrackingUpdate: new Date() }
      );
    } catch (error) {
      console.error('Failed to update tracking time:', error);
    }
  }

  /**
   * Delete old location records (cleanup)
   */
  async deleteOldLocations(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await EmployeeLocation.deleteMany({
        timestamp: { $lt: cutoffDate },
      });

      return result.deletedCount || 0;
    } catch (error) {
      throw new Error(`Failed to delete old locations: ${error}`);
    }
  }

  /**
   * Get location statistics for employee
   */
  async getLocationStatistics(
    employeeId: string,
    hoursBack: number = 24
  ): Promise<UnknownRecord> {
    try {
      const startDate = new Date();
      startDate.setHours(startDate.getHours() - hoursBack);

      const locations = await EmployeeLocation.find({
        employeeId,
        timestamp: { $gte: startDate },
      })
        .sort({ timestamp: 1 })
        .lean();

      if (locations.length === 0) {
        return {
          totalLocations: 0,
          distance: 0,
          averageAccuracy: 0,
          firstLocation: null,
          lastLocation: null,
        };
      }

      let totalDistance = 0;
      for (let i = 1; i < locations.length; i++) {
        totalDistance += LocationValidationService.calculateDistance(
          locations[i - 1].latitude,
          locations[i - 1].longitude,
          locations[i].latitude,
          locations[i].longitude
        );
      }

      const avgAccuracy =
        locations.reduce((sum: number, loc) => sum + loc.accuracy, 0) / locations.length;

      return {
        totalLocations: locations.length,
        distance: parseFloat(totalDistance.toFixed(2)),
        averageAccuracy: parseFloat(avgAccuracy.toFixed(2)),
        firstLocation: locations[0],
        lastLocation: locations[locations.length - 1],
        hoursBack,
      };
    } catch (error) {
      throw new Error(`Failed to get location statistics: ${error}`);
    }
  }
}
