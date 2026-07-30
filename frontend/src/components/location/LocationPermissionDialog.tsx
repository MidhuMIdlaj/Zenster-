import React, { useState, useEffect, useRef } from 'react';
import { MapPin, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import './LocationPermissionDialog.css';

interface LocationPermissionDialogProps {
  isOpen: boolean;
  onGrant: () => void;
  onDeny: () => void;
  employeeName?: string;
}

export const LocationPermissionDialog: React.FC<LocationPermissionDialogProps> = ({
  isOpen,
  onGrant,
  onDeny,
  employeeName = 'Employee',
}) => {
  const [step, setStep] = useState<'initial' | 'granting' | 'success' | 'error'>('initial');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setStep('initial');
      setErrorMessage('');
    }
  }, [isOpen]);

  const handleGrantClick = async () => {
    setStep('granting');
    try {
      // Request browser geolocation permission
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            // Browser permission granted
            // Now request server-side permission
            requestServerPermission();
          },
          (error) => {
            setErrorMessage(
              error.code === 1
                ? 'Location permission denied. Please enable it in your browser settings.'
                : 'Unable to access your location. Please try again.'
            );
            setStep('error');
          }
        );
      } else {
        setErrorMessage('Geolocation is not supported by your browser.');
        setStep('error');
      }
    } catch (error) {
      setErrorMessage('An error occurred while requesting permission.');
      setStep('error');
    }
  };

  const requestServerPermission = async () => {
    try {
      const response = await fetch('/api/location/permission/grant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Send cookies for authentication
      });

      if (!response.ok) {
        throw new Error('Failed to grant permission on server');
      }

      setStep('success');
      setTimeout(() => {
        onGrant();
      }, 2000);
    } catch (error) {
      setErrorMessage('Failed to save permission. Please try again.');
      setStep('error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="location-permission-overlay">
      <div className="location-permission-dialog">
        <button className="permission-close-button" onClick={onDeny} aria-label="Close location permission dialog">
          ×
        </button>
        {step === 'initial' && (
          <>
            <div className="permission-header">
              <MapPin size={32} className="permission-icon" />
              <h2>Location Tracking Permission</h2>
            </div>

            <div className="permission-body">
              <p className="permission-message">
                {employeeName}, your organization needs permission to track your real-time location for
                operational efficiency and safety purposes.
              </p>

              <div className="permission-benefits">
                <h3>This helps us:</h3>
                <ul>
                  <li>✓ Monitor team location in real-time</li>
                  <li>✓ Optimize task assignments</li>
                  <li>✓ Improve emergency response</li>
                  <li>✓ Ensure workplace safety</li>
                </ul>
              </div>

              <div className="permission-note">
                <AlertCircle size={16} />
                <p>
                  Your location data is encrypted and only accessible to authorized administrators.
                  You can revoke this permission anytime from your profile settings.
                </p>
              </div>
            </div>

            <div className="permission-actions">
              <button className="btn-deny" onClick={onDeny}>
                Deny
              </button>
              <button className="btn-grant" onClick={handleGrantClick}>
                Grant Permission
              </button>
            </div>
          </>
        )}

        {step === 'granting' && (
          <div className="permission-loading">
            <div className="spinner"></div>
            <h3>Requesting Permission...</h3>
            <p>Please allow location access in the browser dialog.</p>
          </div>
        )}

        {step === 'success' && (
          <div className="permission-success">
            <CheckCircle size={48} className="success-icon" />
            <h3>Permission Granted!</h3>
            <p>Location tracking is now enabled. Your location will be updated automatically.</p>
          </div>
        )}

        {step === 'error' && (
          <>
            <div className="permission-error">
              <XCircle size={48} className="error-icon" />
              <h3>Permission Error</h3>
              <p>{errorMessage}</p>
            </div>

            <div className="permission-actions">
              <button
                className="btn-retry"
                onClick={() => {
                  setStep('initial');
                  setErrorMessage('');
                }}
              >
                Try Again
              </button>
              <button className="btn-deny" onClick={onDeny}>
                Deny
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LocationPermissionDialog;
