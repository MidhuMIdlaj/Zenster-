import React, { useState } from 'react';
import './LocationStatus.css';

export interface LocationStatusProps {
  isTracking: boolean;
  hasPermission: boolean;
  lastLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp?: string;
  };
  updateInterval: number; // in seconds
  failureCount: number;
  lastError?: string;
  onStartTracking: () => void;
  onStopTracking: () => void;
  onUpdateIntervalChange: (seconds: number) => void;
}

export const LocationStatus: React.FC<LocationStatusProps> = ({
  isTracking,
  hasPermission,
  lastLocation,
  updateInterval,
  failureCount,
  lastError,
  onStartTracking,
  onStopTracking,
  onUpdateIntervalChange,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  const getStatusColor = (): string => {
    if (lastError) return '#ef4444'; // red
    if (isTracking) return '#10b981'; // green
    if (hasPermission) return '#f59e0b'; // amber
    return '#6b7280'; // gray
  };

  return (
    <div className="location-status-container">
      <div className="location-status-card">
        <div className="status-header">
          <div className="status-indicator" style={{ backgroundColor: getStatusColor() }}>
            <span className="status-dot"></span>
          </div>
          
          <div className="status-info">
            <h3 className="status-title">Location Tracking</h3>
            <p className="status-text">
              {!hasPermission && 'Permission not granted'}
              {hasPermission && !isTracking && 'Ready to track'}
              {isTracking && 'Tracking active'}
              {lastError && `Error: ${lastError}`}
            </p>
          </div>

          <button
            className="status-toggle-btn"
            onClick={() => setShowDetails(!showDetails)}
            aria-label="Toggle details"
          >
            {showDetails ? '−' : '+'}
          </button>
        </div>

        {showDetails && (
          <div className="status-details">
            {/* Current Location */}
            {lastLocation && (
              <div className="detail-section">
                <h4>Current Location</h4>
                <div className="location-coords">
                  <div className="coord">
                    <span className="coord-label">Latitude:</span>
                    <span className="coord-value">{lastLocation.latitude.toFixed(6)}</span>
                  </div>
                  <div className="coord">
                    <span className="coord-label">Longitude:</span>
                    <span className="coord-value">{lastLocation.longitude.toFixed(6)}</span>
                  </div>
                  <div className="coord">
                    <span className="coord-label">Accuracy:</span>
                    <span className="coord-value">{Math.round(lastLocation.accuracy)}m</span>
                  </div>
                  {lastLocation.timestamp && (
                    <div className="coord">
                      <span className="coord-label">Time:</span>
                      <span className="coord-value">
                        {new Date(lastLocation.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tracking Settings */}
            {hasPermission && (
              <div className="detail-section">
                <h4>Tracking Settings</h4>
                <div className="setting">
                  <label htmlFor="update-interval">Update Interval:</label>
                  <div className="interval-control">
                    <select
                      id="update-interval"
                      value={updateInterval}
                      onChange={(e) => onUpdateIntervalChange(Number(e.target.value))}
                      disabled={isTracking}
                      className="interval-select"
                    >
                      <option value={60}>1 minute</option>
                      <option value={120}>2 minutes</option>
                      <option value={180}>3 minutes</option>
                      <option value={300}>5 minutes</option>
                      <option value={600}>10 minutes</option>
                      <option value={900}>15 minutes</option>
                    </select>
                    <span className="interval-display">{formatTime(updateInterval)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Status Info */}
            <div className="detail-section">
              <h4>Status</h4>
              <div className="status-items">
                <div className="status-item">
                  <span className="status-label">Permission:</span>
                  <span className={`status-badge ${hasPermission ? 'granted' : 'denied'}`}>
                    {hasPermission ? '✓ Granted' : '✗ Denied'}
                  </span>
                </div>
                <div className="status-item">
                  <span className="status-label">Tracking:</span>
                  <span className={`status-badge ${isTracking ? 'active' : 'inactive'}`}>
                    {isTracking ? '● Active' : '○ Inactive'}
                  </span>
                </div>
                {failureCount > 0 && (
                  <div className="status-item">
                    <span className="status-label">Failed Attempts:</span>
                    <span className="status-badge error">{failureCount}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="detail-section actions">
              {!isTracking && hasPermission && (
                <button className="action-btn start-btn" onClick={onStartTracking}>
                  ▶ Start Tracking
                </button>
              )}
              {isTracking && (
                <button className="action-btn stop-btn" onClick={onStopTracking}>
                  ⏹ Stop Tracking
                </button>
              )}
            </div>

            {/* Error Message */}
            {lastError && (
              <div className="error-section">
                <strong>⚠️ Error:</strong>
                <p>{lastError}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationStatus;
