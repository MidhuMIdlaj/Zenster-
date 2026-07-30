import { useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setTracking,
  setHasPermission,
  setPermissionGranted,
  setLastLocation,
  setLastError,
  setFailureCount,
  setShowPermissionModal,
  resetError,
} from '../store/locationSlice';
import { LocationTrackingService, TrackingState } from '../services/location-tracking-service';
import { LocationApiService } from '../api/locationService';
import { RootState } from '../store/Store';

export interface UseLocationTrackingOptions {
  autoStart?: boolean;
  updateIntervalSeconds?: number;
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
  onPermissionDenied?: () => void;
}

export const useLocationTracking = (options: UseLocationTrackingOptions = {}) => {
  const {
    autoStart = false,
    updateIntervalSeconds = 180, // 3 minutes
    onError,
    onSuccess,
    onPermissionDenied,
  } = options;

  const dispatch = useDispatch();
  const locationState = useSelector((state: RootState) => state.location);
  const trackingServiceRef = useRef(LocationTrackingService.getInstance());
  const unsubscribeRef = useRef<(() => void) | null>(null);

  /**
   * Check if browser supports geolocation
   */
  const isSupported = useCallback(() => {
    return LocationTrackingService.isSupported();
  }, []);

  /**
   * Request geolocation permission
   */
  const requestPermission = useCallback(async () => {
    try {
      dispatch(setShowPermissionModal(false));
      await LocationTrackingService.requestPermission();
      
      // Permission granted, now grant backend permission
      dispatch(setPermissionGranted(true));
      await LocationApiService.grantPermission();

      dispatch(setHasPermission(true));
      trackingServiceRef.current.setPermissionStatus(true);
      
      if (onSuccess) {
        onSuccess('Location permission granted');
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Permission request failed';
      dispatch(setLastError(errorMessage));
      
      if (onError) {
        onError(errorMessage);
      }
      if (onPermissionDenied) {
        onPermissionDenied();
      }

      return false;
    }
  }, [dispatch, onError, onSuccess, onPermissionDenied]);

  /**
   * Start tracking
   */
  const startTracking = useCallback(async () => {
    try {
      if (!isSupported()) {
        throw new Error('Geolocation is not supported in this browser');
      }

      // Check if we have permission
      if (!locationState.hasPermission) {
        // Show permission modal
        dispatch(setShowPermissionModal(true));
        return;
      }

      dispatch(setTracking(true));
      const intervalMs = updateIntervalSeconds * 1000;

      await trackingServiceRef.current.startTracking(intervalMs, (success, error) => {
        if (success) {
          if (onSuccess) onSuccess('Location sent to server');
        } else {
          if (onError) onError(error || 'Failed to send location');
          dispatch(setLastError(error));
        }
      });

      if (onSuccess) {
        onSuccess('Location tracking started');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start tracking';
      dispatch(setLastError(errorMessage));
      dispatch(setTracking(false));
      
      if (onError) {
        onError(errorMessage);
      }
    }
  }, [
    dispatch,
    locationState.hasPermission,
    updateIntervalSeconds,
    isSupported,
    onError,
    onSuccess,
  ]);

  /**
   * Stop tracking
   */
  const stopTracking = useCallback(async () => {
    try {
      await trackingServiceRef.current.stopTracking();
      dispatch(setTracking(false));
      
      if (onSuccess) {
        onSuccess('Location tracking stopped');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop tracking';
      dispatch(setLastError(errorMessage));
      
      if (onError) {
        onError(errorMessage);
      }
    }
  }, [dispatch, onError, onSuccess]);

  /**
   * Revoke permission
   */
  const revokePermission = useCallback(async () => {
    try {
      // Stop tracking first
      if (locationState.isTracking) {
        await stopTracking();
      }

      // Revoke backend permission
      await LocationApiService.revokePermission();

      dispatch(setPermissionGranted(false));
      dispatch(setHasPermission(false));
      trackingServiceRef.current.setPermissionStatus(false);

      if (onSuccess) {
        onSuccess('Location permission revoked');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to revoke permission';
      dispatch(setLastError(errorMessage));
      
      if (onError) {
        onError(errorMessage);
      }
    }
  }, [dispatch, locationState.isTracking, stopTracking, onError, onSuccess]);

  /**
   * Check permission status on mount
   */
  useEffect(() => {
    const checkPermission = async () => {
      try {
        // Check browser permission
        const hasPermission = await LocationTrackingService.checkPermissionStatus();
        
        if (hasPermission) {
          dispatch(setHasPermission(true));
          trackingServiceRef.current.setPermissionStatus(true);

          // Check backend permission status
          const status = await LocationApiService.getPermissionStatus();
          if (status?.data?.trackingEnabled) {
            dispatch(setPermissionGranted(true));
          }

          // Auto-start if enabled
          if (autoStart) {
            startTracking();
          }
        }
      } catch (error) {
        console.error('Error checking permission status:', error);
      }
    };

    checkPermission();

    // Subscribe to service state changes
    unsubscribeRef.current = trackingServiceRef.current.onStateChange(
      (state: TrackingState) => {
        dispatch(setTracking(state.isTracking));
        dispatch(setFailureCount(state.failureCount));
        
        if (state.lastLocation) {
          dispatch(
            setLastLocation({
              latitude: state.lastLocation.latitude,
              longitude: state.lastLocation.longitude,
              accuracy: state.lastLocation.accuracy,
            })
          );
        }

        if (state.lastError) {
          dispatch(setLastError(state.lastError));
        }
      }
    );

    // Cleanup
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [dispatch, autoStart, startTracking]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  return {
    // State
    isTracking: locationState.isTracking,
    hasPermission: locationState.hasPermission,
    permissionGranted: locationState.permissionGranted,
    lastLocation: locationState.lastLocation,
    lastError: locationState.lastError,
    failureCount: locationState.failureCount,
    updateInterval: locationState.updateInterval,
    showPermissionModal: locationState.showPermissionModal,

    // Methods
    isSupported,
    requestPermission,
    startTracking,
    stopTracking,
    revokePermission,
    resetError: () => dispatch(resetError()),
    setUpdateInterval: (seconds: number) => {
      trackingServiceRef.current.setUpdateInterval(seconds);
    },

    // Manual close modal
    closePermissionModal: () => dispatch(setShowPermissionModal(false)),
  };
};
