/**
 * Google Maps Service Wrapper
 * Handles all Google Maps API interactions
 */

import { LocationMarkerData, GeofenceData, InfoWindowData } from '../../types/location-types';

export class GoogleMapsService {
  private static map: google.maps.Map | null = null;
  private static markers: Map<string, google.maps.Marker> = new Map();
  private static infoWindows: Map<string, google.maps.InfoWindow> = new Map();
  private static geofenceCircles: Map<string, google.maps.Circle> = new Map();
  private static polylines: Map<string, google.maps.Polyline> = new Map();

  /**
   * Initialize Google Maps
   */
  static initializeMap(
    container: HTMLElement,
    options: google.maps.MapOptions = {}
  ): google.maps.Map {
    const defaultOptions: google.maps.MapOptions = {
      zoom: options.zoom || 12,
      center: options.center || { lat: 40.7128, lng: -74.006 },
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      fullscreenControl: true,
      zoomControl: true,
      mapTypeControl: true,
      streetViewControl: false,
      ...options,
    };

    this.map = new google.maps.Map(container, defaultOptions);
    return this.map;
  }

  /**
   * Get current map instance
   */
  static getMap(): google.maps.Map | null {
    return this.map;
  }

  /**
   * Add or update marker
   */
  static addMarker(markerId: string, markerData: LocationMarkerData): google.maps.Marker {
    // Remove existing marker if present
    if (this.markers.has(markerId)) {
      this.markers.get(markerId)?.setMap(null);
    }

    const markerOptions: google.maps.MarkerOptions = {
      position: markerData.position,
      map: this.map,
      title: markerData.title,
      label: markerData.label,
      animation: google.maps.Animation.DROP,
    };

    if (markerData.icon) {
      markerOptions.icon = markerData.icon;
    }

    const marker = new google.maps.Marker(markerOptions);

    // Add click listener to show info window
    if (markerData.infoContent) {
      marker.addListener('click', () => {
        this.showInfoWindow(markerId, markerData.infoContent || '', marker.getPosition()!);
      });
    }

    this.markers.set(markerId, marker);
    return marker;
  }

  /**
   * Remove marker
   */
  static removeMarker(markerId: string): void {
    const marker = this.markers.get(markerId);
    if (marker) {
      marker.setMap(null);
      this.markers.delete(markerId);
    }

    // Remove associated info window
    this.removeInfoWindow(markerId);
  }

  /**
   * Update marker position with animation
   */
  static updateMarkerPosition(
    markerId: string,
    newPosition: google.maps.LatLng | { lat: number; lng: number }
  ): void {
    const marker = this.markers.get(markerId);
    if (marker) {
      marker.setPosition(newPosition);
      marker.setAnimation(google.maps.Animation.DROP);
    }
  }

  /**
   * Show info window
   */
  static showInfoWindow(
    windowId: string,
    content: string,
    position?: google.maps.LatLng | { lat: number; lng: number }
  ): void {
    // Close existing info window
    const existingWindow = this.infoWindows.get(windowId);
    if (existingWindow) {
      existingWindow.close();
    }

    const infoWindow = new google.maps.InfoWindow({
      content,
      position,
    });

    infoWindow.open(this.map);
    this.infoWindows.set(windowId, infoWindow);
  }

  /**
   * Remove info window
   */
  static removeInfoWindow(windowId: string): void {
    const infoWindow = this.infoWindows.get(windowId);
    if (infoWindow) {
      infoWindow.close();
      this.infoWindows.delete(windowId);
    }
  }

  /**
   * Create info window HTML content
   */
  static createInfoWindowContent(data: InfoWindowData): string {
    return `
      <div style="font-family: Roboto, Arial, sans-serif; width: 280px;">
        <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">
          ${data.name}
        </div>
        <div style="font-size: 12px; color: #555; margin-bottom: 6px;">
          <strong>Status:</strong>
          <span style="color: ${data.status === 'active' ? '#10b981' : '#ef4444'};">
            ${data.status}
          </span>
        </div>
        <div style="font-size: 12px; color: #555; margin-bottom: 6px;">
          <strong>Address:</strong> ${data.address || 'N/A'}
        </div>
        <div style="font-size: 12px; color: #555; margin-bottom: 6px;">
          <strong>Accuracy:</strong> ±${Math.round(data.accuracy)}m
        </div>
        <div style="font-size: 12px; color: #555;">
          <strong>Last Update:</strong> ${data.lastUpdate.toLocaleTimeString()}
        </div>
        ${data.department ? `<div style="font-size: 12px; color: #555; margin-top: 6px;"><strong>Department:</strong> ${data.department}</div>` : ''}
      </div>
    `;
  }

  /**
   * Add geofence circle
   */
  static addGeofence(geofenceId: string, geofenceData: GeofenceData): google.maps.Circle {
    // Remove existing geofence if present
    if (this.geofenceCircles.has(geofenceId)) {
      this.geofenceCircles.get(geofenceId)?.setMap(null);
    }

    const circle = new google.maps.Circle({
      center: geofenceData.center,
      radius: geofenceData.radius,
      map: this.map,
      fillColor: geofenceData.color || '#FF0000',
      fillOpacity: 0.1,
      strokeColor: geofenceData.color || '#FF0000',
      strokeOpacity: 0.5,
      strokeWeight: 2,
    });

    this.geofenceCircles.set(geofenceId, circle);
    return circle;
  }

  /**
   * Remove geofence
   */
  static removeGeofence(geofenceId: string): void {
    const circle = this.geofenceCircles.get(geofenceId);
    if (circle) {
      circle.setMap(null);
      this.geofenceCircles.delete(geofenceId);
    }
  }

  /**
   * Add polyline (location history path)
   */
  static addPolyline(
    polylineId: string,
    path: Array<{ lat: number; lng: number }>,
    options: Partial<google.maps.PolylineOptions> = {}
  ): google.maps.Polyline {
    // Remove existing polyline if present
    if (this.polylines.has(polylineId)) {
      this.polylines.get(polylineId)?.setMap(null);
    }

    const polyline = new google.maps.Polyline({
      path,
      map: this.map,
      geodesic: true,
      strokeColor: '#4285F4',
      strokeOpacity: 0.7,
      strokeWeight: 2,
      ...options,
    });

    this.polylines.set(polylineId, polyline);
    return polyline;
  }

  /**
   * Remove polyline
   */
  static removePolyline(polylineId: string): void {
    const polyline = this.polylines.get(polylineId);
    if (polyline) {
      polyline.setMap(null);
      this.polylines.delete(polylineId);
    }
  }

  /**
   * Fit map bounds to show all markers
   */
  static fitBoundsToMarkers(): void {
    if (!this.map || this.markers.size === 0) return;

    const bounds = new google.maps.LatLngBounds();

    this.markers.forEach((marker) => {
      bounds.extend(marker.getPosition()!);
    });

    this.map.fitBounds(bounds);
  }

  /**
   * Pan to location
   */
  static panToLocation(lat: number, lng: number, zoom?: number): void {
    if (!this.map) return;

    const location = { lat, lng };
    this.map.panTo(location);

    if (zoom !== undefined) {
      this.map.setZoom(zoom);
    }
  }

  /**
   * Animate to location
   */
  static animateToLocation(lat: number, lng: number, zoom?: number): void {
    if (!this.map) return;

    const location = { lat, lng };

    if (zoom !== undefined) {
      this.map.setZoom(zoom);
    }

    this.map.panTo(location);
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  static calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  /**
   * Check if point is in geofence
   */
  static isPointInGeofence(
    lat: number,
    lng: number,
    geofenceLat: number,
    geofenceLng: number,
    radiusMeters: number
  ): boolean {
    const distanceKm = this.calculateDistance(lat, lng, geofenceLat, geofenceLng);
    const radiusKm = radiusMeters / 1000;
    return distanceKm <= radiusKm;
  }

  /**
   * Clear all markers
   */
  static clearAllMarkers(): void {
    this.markers.forEach((marker) => marker.setMap(null));
    this.markers.clear();
  }

  /**
   * Clear all info windows
   */
  static clearAllInfoWindows(): void {
    this.infoWindows.forEach((window) => window.close());
    this.infoWindows.clear();
  }

  /**
   * Clear all geofences
   */
  static clearAllGeofences(): void {
    this.geofenceCircles.forEach((circle) => circle.setMap(null));
    this.geofenceCircles.clear();
  }

  /**
   * Clear all polylines
   */
  static clearAllPolylines(): void {
    this.polylines.forEach((polyline) => polyline.setMap(null));
    this.polylines.clear();
  }

  /**
   * Get marker count
   */
  static getMarkerCount(): number {
    return this.markers.size;
  }

  /**
   * Get geofence count
   */
  static getGeofenceCount(): number {
    return this.geofenceCircles.size;
  }
}
