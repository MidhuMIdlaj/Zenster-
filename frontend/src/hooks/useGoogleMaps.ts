/**
 * React Hook for Google Maps Initialization and Management
 */

import { useEffect, useRef, useCallback } from 'react';
import { GoogleMapsService } from '../services/location/google-maps-service';

export interface UseGoogleMapsOptions {
  center?: { lat: number; lng: number };
  zoom?: number;
  apiKey?: string;
  containerClass?: string;
}

export const useGoogleMaps = (options: UseGoogleMapsOptions = {}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const isInitializedRef = useRef(false);

  // Initialize maps
  const initializeMap = useCallback(() => {
    if (!mapContainerRef.current || isInitializedRef.current) {
      return;
    }

    try {
      const mapOptions: google.maps.MapOptions = {
        center: options.center || { lat: 40.7128, lng: -74.006 },
        zoom: options.zoom || 12,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        fullscreenControl: true,
        zoomControl: true,
        mapTypeControl: true,
        streetViewControl: false,
      };

      mapRef.current = GoogleMapsService.initializeMap(mapContainerRef.current, mapOptions);
      isInitializedRef.current = true;

      console.log('Google Maps initialized successfully');
    } catch (error) {
      console.error('Error initializing Google Maps:', error);
    }
  }, [options.center, options.zoom]);

  // Initialize on mount
  useEffect(() => {
    // Check if google.maps is available
    if (typeof google === 'undefined' || !google.maps) {
      console.error('Google Maps API is not loaded');
      return;
    }

    initializeMap();

    // Cleanup
    return () => {
      // Don't destroy map on unmount, just detach
      if (mapRef.current) {
        GoogleMapsService.clearAllMarkers();
        GoogleMapsService.clearAllInfoWindows();
      }
    };
  }, [initializeMap]);

  // Pan to location
  const panToLocation = useCallback((lat: number, lng: number, zoom?: number) => {
    GoogleMapsService.panToLocation(lat, lng, zoom);
  }, []);

  // Animate to location
  const animateToLocation = useCallback((lat: number, lng: number, zoom?: number) => {
    GoogleMapsService.animateToLocation(lat, lng, zoom);
  }, []);

  // Fit bounds to markers
  const fitBoundsToMarkers = useCallback(() => {
    GoogleMapsService.fitBoundsToMarkers();
  }, []);

  return {
    mapContainerRef,
    mapRef,
    isInitialized: isInitializedRef.current,
    panToLocation,
    animateToLocation,
    fitBoundsToMarkers,
  };
};

/**
 * Hook to manage location markers on map
 */
export const useMapMarkers = () => {
  const addMarker = useCallback((markerId: string, markerData: any) => {
    return GoogleMapsService.addMarker(markerId, markerData);
  }, []);

  const removeMarker = useCallback((markerId: string) => {
    GoogleMapsService.removeMarker(markerId);
  }, []);

  const updateMarkerPosition = useCallback(
    (markerId: string, newPosition: google.maps.LatLng | { lat: number; lng: number }) => {
      GoogleMapsService.updateMarkerPosition(markerId, newPosition);
    },
    []
  );

  const clearAllMarkers = useCallback(() => {
    GoogleMapsService.clearAllMarkers();
  }, []);

  const getMarkerCount = useCallback(() => {
    return GoogleMapsService.getMarkerCount();
  }, []);

  return {
    addMarker,
    removeMarker,
    updateMarkerPosition,
    clearAllMarkers,
    getMarkerCount,
  };
};

/**
 * Hook to manage geofences on map
 */
export const useMapGeofences = () => {
  const addGeofence = useCallback((geofenceId: string, geofenceData: any) => {
    return GoogleMapsService.addGeofence(geofenceId, geofenceData);
  }, []);

  const removeGeofence = useCallback((geofenceId: string) => {
    GoogleMapsService.removeGeofence(geofenceId);
  }, []);

  const clearAllGeofences = useCallback(() => {
    GoogleMapsService.clearAllGeofences();
  }, []);

  const isPointInGeofence = useCallback(
    (
      lat: number,
      lng: number,
      geofenceLat: number,
      geofenceLng: number,
      radiusMeters: number
    ) => {
      return GoogleMapsService.isPointInGeofence(lat, lng, geofenceLat, geofenceLng, radiusMeters);
    },
    []
  );

  const getGeofenceCount = useCallback(() => {
    return GoogleMapsService.getGeofenceCount();
  }, []);

  return {
    addGeofence,
    removeGeofence,
    clearAllGeofences,
    isPointInGeofence,
    getGeofenceCount,
  };
};

/**
 * Hook to manage polylines (paths) on map
 */
export const useMapPolylines = () => {
  const addPolyline = useCallback((polylineId: string, path: any[], options?: any) => {
    return GoogleMapsService.addPolyline(polylineId, path, options);
  }, []);

  const removePolyline = useCallback((polylineId: string) => {
    GoogleMapsService.removePolyline(polylineId);
  }, []);

  const clearAllPolylines = useCallback(() => {
    GoogleMapsService.clearAllPolylines();
  }, []);

  return {
    addPolyline,
    removePolyline,
    clearAllPolylines,
  };
};

/**
 * Hook to manage info windows on map
 */
export const useMapInfoWindows = () => {
  const showInfoWindow = useCallback(
    (
      windowId: string,
      content: string,
      position?: google.maps.LatLng | { lat: number; lng: number }
    ) => {
      GoogleMapsService.showInfoWindow(windowId, content, position);
    },
    []
  );

  const removeInfoWindow = useCallback((windowId: string) => {
    GoogleMapsService.removeInfoWindow(windowId);
  }, []);

  const clearAllInfoWindows = useCallback(() => {
    GoogleMapsService.clearAllInfoWindows();
  }, []);

  const createInfoContent = useCallback((data: any) => {
    return GoogleMapsService.createInfoWindowContent(data);
  }, []);

  return {
    showInfoWindow,
    removeInfoWindow,
    clearAllInfoWindows,
    createInfoContent,
  };
};
