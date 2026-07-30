import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import LocationPermissionModal from './LocationPermissionModal';
import LocationStatus from './LocationStatus';
import { useLocationTracking } from '../../hooks/useLocationTracking';

/**
 * Example of how to integrate location tracking in an Employee Dashboard
 * Place this component at the top level of your employee pages/dashboard
 */
export const LocationTrackingIntegration: React.FC = () => {
  const dispatch = useDispatch();

  const {
    // State
    isTracking,
    hasPermission,
    permissionGranted,
    lastLocation,
    lastError,
    failureCount,
    updateInterval,
    showPermissionModal,

    // Methods
    isSupported,
    requestPermission,
    startTracking,
    stopTracking,
    revokePermission,
    resetError,
    setUpdateInterval,
    closePermissionModal,
  } = useLocationTracking({
    autoStart: false, // Don't auto-start; wait for user permission
    updateIntervalSeconds: 180, // 3 minutes
    onSuccess: (message: string) => {
      console.log('Location Success:', message);
      // You can dispatch toast notifications here
    },
    onError: (error: string) => {
      console.error('Location Error:', error);
      // You can dispatch error notifications here
    },
    onPermissionDenied: () => {
      console.warn('Location permission denied');
      // Handle permission denial
    },
  });

  // Show warning if geolocation not supported
  useEffect(() => {
    if (!isSupported()) {
      console.warn('Geolocation API not supported in this browser');
    }
  }, [isSupported]);

  // Handle permission modal submission
  const handlePermissionGrant = async () => {
    const success = await requestPermission();
    if (success) {
      // Start tracking after permission granted
      await startTracking();
    }
  };

  const handlePermissionDeny = () => {
    closePermissionModal();
    // Optionally notify user they can enable later
  };

  // Only render if supported
  if (!isSupported()) {
    return null;
  }

  return (
    <>
      {/* Permission Modal */}
      <LocationPermissionModal
        isOpen={showPermissionModal}
        onGrant={handlePermissionGrant}
        onDeny={handlePermissionDeny}
        error={lastError}
      />

      {/* Location Status Display */}
      {hasPermission && (
        <LocationStatus
          isTracking={isTracking}
          hasPermission={hasPermission}
          lastLocation={lastLocation}
          updateInterval={updateInterval}
          failureCount={failureCount}
          lastError={lastError}
          onStartTracking={startTracking}
          onStopTracking={stopTracking}
          onUpdateIntervalChange={setUpdateInterval}
        />
      )}

      {/* Permission Required Banner */}
      {!hasPermission && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '8px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ color: '#92400e', fontSize: '14px' }}>
            📍 Enable location tracking to help management understand your work location
          </span>
          <button
            onClick={async () => {
              const success = await requestPermission();
              if (success) {
                await startTracking();
              }
            }}
            style={{
              padding: '6px 12px',
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          >
            Enable Now
          </button>
        </div>
      )}
    </>
  );
};

/**
 * Alternative: Minimal Implementation
 * Use this for a simpler, button-based interface
 */
export const LocationTrackingButton: React.FC = () => {
  const { isTracking, hasPermission, isSupported, startTracking, stopTracking } =
    useLocationTracking();

  if (!isSupported() || !hasPermission) {
    return null;
  }

  return (
    <button
      onClick={isTracking ? stopTracking : startTracking}
      style={{
        padding: '8px 16px',
        backgroundColor: isTracking ? '#ef4444' : '#10b981',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
      }}
    >
      {isTracking ? '⏹ Stop Tracking' : '▶ Start Tracking'}
    </button>
  );
};

export default LocationTrackingIntegration;
