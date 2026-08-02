import { useState, useEffect, useCallback } from 'react';
import { configManager } from '../config/config';

interface UseLocationPermissionReturn {
  hasPermission: boolean;
  isPermissionAsked: boolean;
  requestPermission: () => Promise<boolean>;
  revokePermission: () => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

export const useLocationPermission = (active: boolean = true): UseLocationPermissionReturn => {
  const apiBaseUrl = configManager.getApiBaseUrl();
  const [hasPermission, setHasPermission] = useState(false);
  const [isPermissionAsked, setIsPermissionAsked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkPermissionStatus = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/location/permission/status`, {
        credentials: 'include', // Send cookies for authentication
      });

      // Check for HTML error response (not authenticated yet)
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          // Not authenticated yet, skip silently
          setIsPermissionAsked(false);
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      // Verify it's JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        setIsPermissionAsked(false);
        return;
      }

      const data = await response.json();
      const permissionStatus = data.data?.hasPermission || false;
      setHasPermission(permissionStatus);
      setIsPermissionAsked(true);
    } catch (err) {
      // Silently fail on mount - permission check can retry when user interacts
      setIsPermissionAsked(false);
    }
  }, []);

  // Check current permission status only when active
  useEffect(() => {
    if (!active) {
      setHasPermission(false);
      setIsPermissionAsked(false);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Small delay to ensure auth is ready
    const timer = setTimeout(() => {
      checkPermissionStatus();
    }, 500);
    return () => clearTimeout(timer);
  }, [active, checkPermissionStatus]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!active) {
      setError('Unable to request location permission: not authenticated');
      return false;
    }
    setIsLoading(true);
    setError(null);
    try {
      // First request browser geolocation
      const geoPermission = await new Promise<boolean>((resolve) => {
        if (!navigator.geolocation) {
          setError('Geolocation is not supported by your browser');
          resolve(false);
          return;
        }

        navigator.geolocation.getCurrentPosition(
          () => {
            resolve(true);
          },
          (err) => {
            if (err.code === 1) {
              setError('Location permission was denied. Please enable it in your browser settings.');
            } else {
              setError('Unable to access your location');
            }
            resolve(false);
          }
        );
      });

      if (!geoPermission) {
        setIsLoading(false);
        return false;
      }

      // Then request server permission
      const response = await fetch(`${apiBaseUrl}/location/permission/grant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Send cookies for authentication
      });

      // Check for HTML error response
      if (!response.ok) {
        if (response.status === 401) {
          setError('Your session expired. Please login again.');
        } else if (response.status === 403) {
          setError('You do not have permission to enable tracking.');
        } else {
          setError('Failed to save permission on server');
        }
        setIsLoading(false);
        return false;
      }

      // Verify it's JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        setError('Invalid response from server');
        setIsLoading(false);
        return false;
      }

      const data = await response.json();
      setHasPermission(true);
      setIsPermissionAsked(true);
      setIsLoading(false);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to request permission';
      setError(message);
      setIsLoading(false);
      return false;
    }
  }, []);

  const revokePermission = useCallback(async (): Promise<boolean> => {
    if (!active) {
      setError('Unable to revoke location permission: not authenticated');
      return false;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBaseUrl}/location/permission/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
       credentials: 'include', // Send cookies for authentication
     });

      if (response.ok) {
        setHasPermission(false);
        setIsLoading(false);
        return true;
      } else {
        setError('Failed to revoke permission');
        setIsLoading(false);
        return false;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to revoke permission';
      setError(message);
      setIsLoading(false);
      return false;
    }
  }, []);

  return {
    hasPermission,
    isPermissionAsked,
    requestPermission,
    revokePermission,
    isLoading,
    error,
  };
};

export default useLocationPermission;
