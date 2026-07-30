import React, { useState } from 'react';
import './LocationPermissionModal.css';

export interface LocationPermissionModalProps {
  isOpen: boolean;
  onGrant: () => Promise<void>;
  onDeny: () => void;
  isLoading?: boolean;
  error?: string;
}

export const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({
  isOpen,
  onGrant,
  onDeny,
  isLoading = false,
  error,
}) => {
  const [localError, setLocalError] = useState<string | null>(null);

  const handleGrant = async () => {
    try {
      setLocalError(null);
      await onGrant();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to grant permission';
      setLocalError(errorMessage);
    }
  };

  const handleDeny = () => {
    setLocalError(null);
    onDeny();
  };

  if (!isOpen) return null;

  return (
    <div className="location-permission-modal-overlay">
      <div className="location-permission-modal">
        <div className="modal-header">
          <h2>📍 Location Tracking Permission</h2>
          <button
            className="modal-close-btn"
            onClick={handleDeny}
            disabled={isLoading}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="modal-content">
          <div className="permission-icon">📍</div>
          
          <p className="modal-description">
            We need your permission to track your real-time location for work purposes.
            This helps management understand your work location and optimize operations.
          </p>

          <div className="permission-benefits">
            <h3>Why we need this:</h3>
            <ul>
              <li>✓ Verify your actual work location</li>
              <li>✓ Monitor work hours and location changes</li>
              <li>✓ Provide location-based services</li>
              <li>✓ Improve operational efficiency</li>
            </ul>
          </div>

          <div className="privacy-note">
            <strong>Privacy Notice:</strong>
            <p>
              Your location data is encrypted and retained for 30 days. Only authorized
              administrators can view your location. You can revoke this permission anytime.
            </p>
          </div>

          {(error || localError) && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <span>{error || localError}</span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-deny"
            onClick={handleDeny}
            disabled={isLoading}
          >
            Not Now
          </button>
          <button
            className="btn btn-grant"
            onClick={handleGrant}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Enabling...
              </>
            ) : (
              'Allow Location Access'
            )}
          </button>
        </div>

        <div className="modal-footer-note">
          <small>
            By clicking "Allow Location Access", you grant permission to access your device's
            location. You can manage this permission in your browser settings.
          </small>
        </div>
      </div>
    </div>
  );
};

export default LocationPermissionModal;
