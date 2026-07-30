// Location-related TypeScript types and interfaces

export interface EmployeeLocation {
  employeeId: string;
  employeeName?: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
  timestamp: Date;
  provider?: 'browser-geolocation' | 'gps' | 'network';
  speed?: number;
  heading?: number;
}

export interface EmployeeLocationWithStatus extends EmployeeLocation {
  trackingEnabled: boolean;
  lastUpdate: Date;
  status: 'active' | 'inactive' | 'offline';
  distanceTraveled?: number;
}

export interface LocationMarkerData {
  id: string;
  position: google.maps.LatLng | { lat: number; lng: number };
  title: string;
  label?: string;
  icon?: string;
  data?: EmployeeLocation;
  infoContent?: string;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface GeofenceData {
  id: string;
  center: { lat: number; lng: number };
  radius: number;
  name: string;
  color?: string;
  description?: string;
}

export interface LocationHistory {
  points: Array<{
    lat: number;
    lng: number;
    timestamp: Date;
    accuracy: number;
  }>;
  distance: number;
  startTime: Date;
  endTime: Date;
}

export interface MapState {
  isLoaded: boolean;
  center: { lat: number; lng: number };
  zoom: number;
  markers: LocationMarkerData[];
  geofences: GeofenceData[];
  selectedEmployeeId?: string;
  showHistory: boolean;
  selectedTimeRange?: {
    start: Date;
    end: Date;
  };
}

export interface RealTimeLocationUpdate {
  employeeId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
}

export interface LocationFilterOptions {
  searchText?: string;
  statusFilter?: 'all' | 'active' | 'inactive' | 'offline';
  department?: string;
  role?: string;
}

export interface MapControlOptions {
  enableZoom?: boolean;
  enablePan?: boolean;
  enableMarkerCluster?: boolean;
  enableHeatmap?: boolean;
  enableGeofence?: boolean;
}

export interface InfoWindowData {
  employeeId: string;
  name: string;
  position: { lat: number; lng: number };
  address: string;
  accuracy: number;
  lastUpdate: Date;
  status: string;
  department?: string;
  phone?: string;
}

export interface LocationAnalytics {
  totalDistance: number;
  averageSpeed: number;
  stops: Array<{
    location: { lat: number; lng: number };
    duration: number;
    timestamp: Date;
  }>;
  heatmapData: Array<{
    location: { lat: number; lng: number };
    weight: number;
  }>;
}

export interface LocationNotification {
  id: string;
  employeeId: string;
  type: 'geofence' | 'stopped' | 'offline' | 'alert';
  message: string;
  timestamp: Date;
  read: boolean;
}
