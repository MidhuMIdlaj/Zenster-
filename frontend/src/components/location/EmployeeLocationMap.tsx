/**
 * Employee Location Map Component
 * Displays own location on Google Map (for employees)
 */

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/Store';
import { useLocationTracking } from '../../hooks/useLocationTracking';
import {
  useGoogleMaps,
  useMapMarkers,
  useMapGeofences,
  useMapInfoWindows,
} from '../../hooks/useGoogleMaps';
import { RealTimeLocationService } from '../../services/location/realtime-location-service';
import { EmployeeLocationWithStatus } from '../../types/location-types';
import './LocationMapContainer.css';

interface EmployeeLocationMapProps {
  employeeId: string;
  employeeName?: string;
  onLocationChange?: (location: EmployeeLocationWithStatus) => void;
  showAccuracyCircle?: boolean;
  showAddressInfo?: boolean;
  autoFit?: boolean;
}

export const EmployeeLocationMap: React.FC<EmployeeLocationMapProps> = ({
  employeeId,
  employeeName = 'You',
  onLocationChange,
  showAccuracyCircle = true,
  showAddressInfo = true,
  autoFit = true,
}) => {
  const dispatch = useAppDispatch();
  const { mapContainerRef, panToLocation, animateToLocation } = useGoogleMaps({
    center: { lat: 40.7128, lng: -74.006 },
    zoom: 16,
  });

  const { addMarker, removeMarker, updateMarkerPosition, clearAllMarkers } = useMapMarkers();
  const { addGeofence, removeGeofence, clearAllGeofences } = useMapGeofences();
  const { showInfoWindow, createInfoContent } = useMapInfoWindows();

  const [currentLocation, setCurrentLocation] = useState<EmployeeLocationWithStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Get location from Redux
  const locationState = useAppSelector((state) => state.location);

  // Initialize map and fetch location
  useEffect(() => {
    const initializeLocation = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get current location
        const locationService = RealTimeLocationService.getInstance();
        const location = await locationService.getEmployeeCurrentLocation(employeeId);

        if (location) {
          setCurrentLocation(location);
          onLocationChange?.(location);

          // Pan to location
          if (autoFit) {
            setTimeout(() => {
              panToLocation(location.latitude, location.longitude, 16);
            }, 500);
          }
        } else {
          setError('Unable to fetch current location');
        }
      } catch (err) {
        setError('Error loading location');
        console.error(err);
      } finally {
        setIsLoading(false);
        setMapReady(true);
      }
    };

    // Small delay to ensure map is initialized
    const timer = setTimeout(initializeLocation, 500);
    return () => clearTimeout(timer);
  }, [employeeId, panToLocation, autoFit, onLocationChange]);

  // Update marker when location changes
  useEffect(() => {
    if (!mapReady || !currentLocation) return;

    // Clear existing markers
    clearAllMarkers();

    // Add marker for current location
    const marker = addMarker(`employee-${employeeId}`, {
      position: {
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
      },
      title: employeeName,
      label: 'You',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#4285F4',
        fillOpacity: 0.8,
        strokeColor: '#1967D2',
        strokeWeight: 2,
      },
      infoContent: createInfoContent({
        employeeId: currentLocation.employeeId,
        name: employeeName,
        position: {
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
        },
        address: currentLocation.address || 'Location data not available',
        accuracy: currentLocation.accuracy,
        lastUpdate: currentLocation.lastUpdate,
        status: currentLocation.status,
      }),
    });

    // Show accuracy circle if enabled
    if (showAccuracyCircle && currentLocation.accuracy > 0) {
      clearAllGeofences();

      addGeofence(`accuracy-${employeeId}`, {
        id: `accuracy-${employeeId}`,
        center: {
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
        },
        radius: currentLocation.accuracy,
        name: 'Accuracy Circle',
        color: '#4285F4',
      });
    }

    // Show info window
    showInfoWindow(
      `info-${employeeId}`,
      createInfoContent({
        employeeId: currentLocation.employeeId,
        name: employeeName,
        position: {
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
        },
        address: currentLocation.address || 'Getting address...',
        accuracy: currentLocation.accuracy,
        lastUpdate: currentLocation.lastUpdate,
        status: currentLocation.status,
      }),
      {
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
      }
    );

    // Add marker click handler
    if (marker) {
      marker.addListener('click', () => {
        animateToLocation(currentLocation.latitude, currentLocation.longitude, 17);
      });
    }
  }, [
    currentLocation,
    mapReady,
    employeeId,
    employeeName,
    showAccuracyCircle,
    addMarker,
    clearAllMarkers,
    addGeofence,
    clearAllGeofences,
    showInfoWindow,
    createInfoContent,
    animateToLocation,
  ]);

  // Monitor location updates from Redux
  useEffect(() => {
    if (locationState.lastLocation && locationState.lastLocation.employeeId === employeeId) {
      const updatedLocation: EmployeeLocationWithStatus = {
        ...locationState.lastLocation,
        trackingEnabled: locationState.trackingEnabled,
        lastUpdate: new Date(locationState.lastLocation.timestamp),
        status: locationState.trackingEnabled ? 'active' : 'inactive',
      };

      setCurrentLocation(updatedLocation);
      onLocationChange?.(updatedLocation);

      // Update marker position smoothly
      if (mapReady) {
        updateMarkerPosition(`employee-${employeeId}`, {
          lat: updatedLocation.latitude,
          lng: updatedLocation.longitude,
        });

        // Update accuracy circle
        if (showAccuracyCircle) {
          removeGeofence(`accuracy-${employeeId}`);
          addGeofence(`accuracy-${employeeId}`, {
            id: `accuracy-${employeeId}`,
            center: {
              lat: updatedLocation.latitude,
              lng: updatedLocation.longitude,
            },
            radius: updatedLocation.accuracy,
            name: 'Accuracy Circle',
            color: '#4285F4',
          });
        }
      }
    }
  }, [
    locationState.lastLocation,
    locationState.trackingEnabled,
    employeeId,
    mapReady,
    showAccuracyCircle,
    updateMarkerPosition,
    removeGeofence,
    addGeofence,
    onLocationChange,
  ]);

  return (
    <div className="employee-location-map-container">
      <div className="map-header">
        <h2>📍 My Location</h2>
        <div className="location-status">
          {locationState.trackingEnabled ? (
            <span className="status-badge active">Tracking Enabled</span>
          ) : (
            <span className="status-badge inactive">Tracking Disabled</span>
          )}
        </div>
      </div>

      <div className="map-wrapper" ref={mapContainerRef} style={{ height: '600px' }} />

      {isLoading && (
        <div className="map-overlay loading">
          <div className="spinner"></div>
          <p>Loading location...</p>
        </div>
      )}

      {error && (
        <div className="map-overlay error">
          <p>{error}</p>
        </div>
      )}

      {currentLocation && (
        <div className="location-info-panel">
          <div className="info-row">
            <span className="label">Latitude:</span>
            <span className="value">{currentLocation.latitude.toFixed(6)}°</span>
          </div>
          <div className="info-row">
            <span className="label">Longitude:</span>
            <span className="value">{currentLocation.longitude.toFixed(6)}°</span>
          </div>
          <div className="info-row">
            <span className="label">Accuracy:</span>
            <span className="value">±{Math.round(currentLocation.accuracy)}m</span>
          </div>
          <div className="info-row">
            <span className="label">Last Update:</span>
            <span className="value">{currentLocation.lastUpdate.toLocaleTimeString()}</span>
          </div>
          {currentLocation.address && (
            <div className="info-row">
              <span className="label">Address:</span>
              <span className="value address">{currentLocation.address}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmployeeLocationMap;
