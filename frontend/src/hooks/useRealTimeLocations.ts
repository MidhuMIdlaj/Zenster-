/**
 * React Hook for Real-time Location Updates
 * Handles polling, subscriptions, and location state management
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { RealTimeLocationService } from '../services/location/realtime-location-service';
import { EmployeeLocationWithStatus } from '../types/location-types';

export interface UseRealTimeLocationsOptions {
  pollingInterval?: number;
  autoStart?: boolean;
  onUpdate?: (locations: EmployeeLocationWithStatus[]) => void;
  onError?: (error: Error) => void;
}

export const useRealTimeLocations = (options: UseRealTimeLocationsOptions = {}) => {
  const {
    pollingInterval = 30000,
    autoStart = true,
    onUpdate,
    onError,
  } = options;

  const [locations, setLocations] = useState<EmployeeLocationWithStatus[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const serviceRef = useRef<RealTimeLocationService>(RealTimeLocationService.getInstance());

  // Initialize polling
  useEffect(() => {
    const service = serviceRef.current;

    if (autoStart && !service.isPollingActive()) {
      service.startPolling(pollingInterval);
      setIsPolling(true);
    }

    // Subscribe to updates
    unsubscribeRef.current = service.onLocationsUpdated((updatedLocations) => {
      setLocations(updatedLocations);
      onUpdate?.(updatedLocations);
    });

    // Cleanup
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [autoStart, pollingInterval, onUpdate]);

  // Start polling
  const startPolling = useCallback(() => {
    const service = serviceRef.current;
    if (!service.isPollingActive()) {
      service.startPolling(pollingInterval);
      setIsPolling(true);
    }
  }, [pollingInterval]);

  // Stop polling
  const stopPolling = useCallback(() => {
    const service = serviceRef.current;
    service.stopPolling();
    setIsPolling(false);
  }, []);

  // Get employee location
  const getEmployeeLocation = useCallback(
    async (employeeId: string): Promise<EmployeeLocationWithStatus | null> => {
      try {
        const service = serviceRef.current;
        return await service.getEmployeeCurrentLocation(employeeId);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        onError?.(error);
        return null;
      }
    },
    [onError]
  );

  // Get employee location history
  const getEmployeeHistory = useCallback(
    async (employeeId: string, hours: number = 24): Promise<EmployeeLocationWithStatus[]> => {
      try {
        const service = serviceRef.current;
        return await service.getEmployeeLocationHistory(employeeId, hours);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        onError?.(error);
        return [];
      }
    },
    [onError]
  );

  // Get location statistics
  const getStatistics = useCallback(
    async (employeeId: string, hours: number = 24) => {
      try {
        const service = serviceRef.current;
        return await service.getLocationStatistics(employeeId, hours);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        onError?.(error);
        return null;
      }
    },
    [onError]
  );

  // Check if employee moved
  const checkMovement = useCallback(
    (
      employeeId: string,
      lat1: number,
      lng1: number,
      lat2: number,
      lng2: number,
      thresholdMeters: number = 10
    ): boolean => {
      const service = serviceRef.current;
      return service.hasMoved(employeeId, lat1, lng1, lat2, lng2, thresholdMeters);
    },
    []
  );

  // Set polling interval
  const setPollingInterval = useCallback((interval: number) => {
    const service = serviceRef.current;
    service.setPollingInterval(interval);
  }, []);

  // Get subscriber count
  const getSubscriberCount = useCallback(() => {
    const service = serviceRef.current;
    return service.getSubscriberCount();
  }, []);

  return {
    locations,
    isPolling,
    error,
    startPolling,
    stopPolling,
    getEmployeeLocation,
    getEmployeeHistory,
    getStatistics,
    checkMovement,
    setPollingInterval,
    getSubscriberCount,
  };
};

/**
 * Hook to get specific employee location
 */
export const useEmployeeLocation = (employeeId: string, autoFetch: boolean = true) => {
  const [location, setLocation] = useState<EmployeeLocationWithStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const service = RealTimeLocationService.getInstance();

  useEffect(() => {
    if (!autoFetch) return;

    const fetchLocation = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const loc = await service.getEmployeeCurrentLocation(employeeId);
        setLocation(loc);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocation();
  }, [employeeId, autoFetch]);

  const refetch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const loc = await service.getEmployeeCurrentLocation(employeeId);
      setLocation(loc);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  return { location, isLoading, error, refetch };
};

/**
 * Hook to get location history for an employee
 */
export const useLocationHistory = (employeeId: string, hours: number = 24) => {
  const [history, setHistory] = useState<EmployeeLocationWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const service = RealTimeLocationService.getInstance();

  const fetchHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const hist = await service.getEmployeeLocationHistory(employeeId, hours);
      setHistory(hist);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, hours]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { history, isLoading, error, refetch: fetchHistory };
};

/**
 * Hook to get location statistics
 */
export const useLocationStatistics = (employeeId: string, hours: number = 24) => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const service = RealTimeLocationService.getInstance();

  const fetchStatistics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await service.getLocationStatistics(employeeId, hours);
      setStats(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, hours]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return { stats, isLoading, error, refetch: fetchStatistics };
};
