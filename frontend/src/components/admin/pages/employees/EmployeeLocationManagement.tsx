/**
 * Employee Location Management - Simple Map Display
 * Shows employees with their locations on a Leaflet map
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Map, Search, Filter, AlertCircle, Loader } from 'lucide-react';
import './EmployeeLocationManagement.css';

interface EmployeeLocation {
  employeeId: string;
  employeeName: string;
  latitude: number;
  longitude: number;
  address: string;
  accuracy: number;
  lastUpdate: string;
  status: 'active' | 'inactive';
  trackingEnabled: boolean;
}

const getLocationConfidence = (accuracy: number) => {
  if (!Number.isFinite(accuracy)) {
    return { label: 'Unknown accuracy', className: 'unknown' };
  }

  if (accuracy <= 50) {
    return { label: 'High confidence', className: 'high' };
  }

  if (accuracy <= 500) {
    return { label: 'Medium confidence', className: 'medium' };
  }

  return { label: 'Low confidence', className: 'low' };
};

const createMarkerIcon = (employeeName: string, status: 'active' | 'inactive') => {
  const initials = employeeName ? employeeName.charAt(0).toUpperCase() : 'E';
  return L.divIcon({
    className: `employee-location-marker ${status}`,
    html: `<div class="marker-badge">${initials}</div>`,
    iconSize: [34, 38],
    iconAnchor: [17, 38],
    popupAnchor: [0, -40],
  });
};

const getJitteredPosition = (
  latitude: number,
  longitude: number,
  index: number,
  count: number
): L.LatLngExpression => {
  if (count <= 1) {
    return [latitude, longitude];
  }

  const offsetDistance = 0.00012; // small offset for overlapping markers
  const angle = (index / count) * Math.PI * 2;
  return [latitude + Math.sin(angle) * offsetDistance, longitude + Math.cos(angle) * offsetDistance];
};

interface EmployeeLocationManagementProps {
  showListView?: boolean;
  showMapView?: boolean;
}

export const EmployeeLocationManagement: React.FC<EmployeeLocationManagementProps> = ({
  showListView = true,
  showMapView = true,
}) => {
  const [viewMode, setViewMode] = useState<'map' | 'list' | 'split'>('split');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeLocation | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [locations, setLocations] = useState<EmployeeLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);

  // Fetch locations on mount
  useEffect(() => {
    fetchLocations();
    const interval = setInterval(fetchLocations, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredLocations = useMemo(
    () =>
      [...locations]
        .filter((loc) => {
          const matchesSearch = loc.employeeName.toLowerCase().includes(searchText.toLowerCase());
          const matchesFilter = filterStatus === 'all' || loc.status === filterStatus;
          return matchesSearch && matchesFilter;
        })
        .sort((a, b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime()),
    [locations, searchText, filterStatus]
  );

  useEffect(() => {
    if (!filteredLocations.length) {
      setSelectedEmployee(null);
      return;
    }

    setSelectedEmployee((current) => {
      if (current && filteredLocations.some((location) => location.employeeId === current.employeeId)) {
        return current;
      }

      return filteredLocations[0];
    });
  }, [filteredLocations]);

  // Initialize map when needed
  useEffect(() => {
    const shouldShowMap = viewMode === 'map' || viewMode === 'split';

    if (shouldShowMap && mapContainerRef.current) {
      renderMap();
      return;
    }

    mapRef.current?.remove();
    mapRef.current = null;
    markerLayerRef.current = null;
  }, [viewMode, filteredLocations]);

  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 100);
    }
  }, [viewMode]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
    };
  }, []);

  const fetchLocations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/location/all-current', {
        credentials: 'include', // Send cookies for authentication
      });
      
      // Handle different response statuses
      if (response.status === 403) {
        throw new Error('You do not have permission to view employee locations. Only admins and coordinators can access this feature.');
      }
      
      if (response.status === 401) {
        throw new Error('Your session has expired. Please login again.');
      }
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          throw new Error('Server error occurred. Please try again later.');
        }
        throw new Error(`Failed to fetch locations (${response.status})`);
      }
      
      // Try to parse as JSON, but handle cases where it might not be JSON
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // If not JSON, try to parse anyway (some servers might not set content-type)
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          // Response is not JSON - treat as empty locations (no console spam)
          data = { data: { locations: [] } };
        }
      }
      
      const locationArray = data.data?.locations || data.locations || [];
      setLocations(locationArray);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch employee locations';
      setError(message);
      setLocations([]);
    } finally {
     setIsLoading(false);
    }
  };

  const renderMap = () => {
    if (!mapContainerRef.current) return;

    const firstLocation = filteredLocations[0];
    const center: L.LatLngExpression = firstLocation
      ? [firstLocation.latitude, firstLocation.longitude]
      : [20.5937, 78.9629];

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        center,
        zoom: firstLocation ? 12 : 5,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapRef.current);

      markerLayerRef.current = L.layerGroup().addTo(mapRef.current);
    }

    markerLayerRef.current?.clearLayers();

    const bounds = L.latLngBounds([]);
    const groupedByPosition = filteredLocations.reduce<Record<string, EmployeeLocation[]>>(
      (groups, location) => {
        const key = `${location.latitude.toFixed(6)}_${location.longitude.toFixed(6)}`;
        groups[key] = groups[key] || [];
        groups[key].push(location);
        return groups;
      },
      {}
    );

    Object.values(groupedByPosition).forEach((locationsAtSamePoint) => {
      locationsAtSamePoint.forEach((location, index) => {
        const latLng = getJitteredPosition(
          location.latitude,
          location.longitude,
          index,
          locationsAtSamePoint.length
        );
        const confidence = getLocationConfidence(location.accuracy);
        bounds.extend(latLng);

        if (Number.isFinite(location.accuracy) && location.accuracy > 0) {
          L.circle(latLng, {
            radius: location.accuracy,
            color: location.accuracy > 500 ? '#ef4444' : '#3b82f6',
            fillColor: location.accuracy > 500 ? '#fecaca' : '#bfdbfe',
            fillOpacity: 0.2,
            weight: 1,
          }).addTo(markerLayerRef.current!);
        }

        L.marker(latLng, {
          icon: createMarkerIcon(location.employeeName, location.status),
        })
          .addTo(markerLayerRef.current!)
          .bindPopup(
            `<div class="employee-location-popup">
              <strong>${location.employeeName}</strong><br/>
              ${location.address || 'Address not available'}<br/>
              Lat: ${location.latitude.toFixed(4)}<br/>
              Lng: ${location.longitude.toFixed(4)}<br/>
              Accuracy: ${Math.round(location.accuracy)}m<br/>
              ${confidence.label}
            </div>`
          )
          .on('click', () => {
            setSelectedEmployee(location);
          });
      });
    });

    if (filteredLocations.length > 1) {
      mapRef.current.fitBounds(bounds, { padding: [40, 40] });
    } else if (firstLocation) {
      mapRef.current.setView([firstLocation.latitude, firstLocation.longitude], 14);
    } else {
      mapRef.current.setView(center, 5);
    }

    setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 0);
  };

  return (
    <div className="employee-location-management-container">
      {/* Header */}
      <div className="location-management-header">
        <div className="header-title">
          <Map className="header-icon" size={24} />
          <div>
            <h1>📍 Employee Location Tracking</h1>
            <p>View and manage employee locations in real-time</p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="view-mode-toggle">
          {showMapView && (
            <button
              className={`view-button ${viewMode === 'map' ? 'active' : ''}`}
              onClick={() => setViewMode('map')}
            >
              Map
            </button>
          )}
          {showListView && (
            <button
              className={`view-button ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
          )}
          {showMapView && showListView && (
            <button
              className={`view-button ${viewMode === 'split' ? 'active' : ''}`}
              onClick={() => setViewMode('split')}
            >
              Split
            </button>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Controls */}
      <div className="location-management-controls">
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search employee by name..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-container">
          <Filter size={18} className="filter-icon" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {isLoading && <Loader size={18} className="loading-spinner" />}
        <span className="location-count">{filteredLocations.length} locations</span>
      </div>

      {/* Content Area */}
      <div className={`location-management-content view-${viewMode}`}>
        {/* Map View */}
        {(viewMode === 'map' || viewMode === 'split') && (
          <div className="map-section">
            {isLoading && !locations.length ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Loader className="loading-spinner" size={32} />
              </div>
            ) : filteredLocations.length === 0 ? (
              <div className="map-status">
                <AlertCircle size={28} />
                <p>No employee locations match your filters.</p>
              </div>
            ) : (
              <div ref={mapContainerRef} className="map-wrapper" />
            )}
          </div>
        )}

        {/* Details View */}
        {(viewMode === 'list' || viewMode === 'split') && (
          <div className="details-section">
            {viewMode === 'list' ? (
              <div className="employee-list-panel">
                {filteredLocations.length === 0 ? (
                  <EmptyDetailsPlaceholder />
                ) : (
                  <div className="employee-list-items">
                    {filteredLocations.map((employee) => (
                      <button
                        key={employee.employeeId}
                        type="button"
                        className={`employee-list-item ${selectedEmployee?.employeeId === employee.employeeId ? 'selected' : ''}`}
                        onClick={() => setSelectedEmployee(employee)}
                      >
                        <div className="employee-list-title">
                          <span>{employee.employeeName || employee.employeeId}</span>
                          <span className={`status-badge ${employee.status}`}>{employee.status}</span>
                        </div>
                        <div className="employee-list-meta">
                          <span>Lat: {employee.latitude.toFixed(4)}</span>
                          <span>Lng: {employee.longitude.toFixed(4)}</span>
                        </div>
                        <div className="employee-list-footer">
                          <span>{new Date(employee.lastUpdate).toLocaleString()}</span>
                          <span>{employee.address || 'No address'}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : selectedEmployee ? (
              <SelectedEmployeeDetails employee={selectedEmployee} />
            ) : (
              <EmptyDetailsPlaceholder />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Selected Employee Details Panel
 */
const SelectedEmployeeDetails: React.FC<{ employee: EmployeeLocation }> = ({
  employee,
}) => (
  <div className="selected-employee-details">
    <div className="details-header">
      <div className="employee-avatar">
        {employee.employeeName ? employee.employeeName.charAt(0).toUpperCase() : 'E'}
      </div>
      <div className="employee-header-info">
        <h2>{employee.employeeName}</h2>
        <span className={`status-badge ${employee.status}`}>{employee.status}</span>
      </div>
    </div>

    <div className="details-grid">
      <div className="detail-item">
        <span className="detail-label">Latitude</span>
        <span className="detail-value detail-code">{employee.latitude.toFixed(6)}°</span>
      </div>

      <div className="detail-item">
        <span className="detail-label">Longitude</span>
        <span className="detail-value detail-code">{employee.longitude.toFixed(6)}°</span>
      </div>

      <div className="detail-item">
        <span className="detail-label">Accuracy</span>
        <span className="detail-value">±{Math.round(employee.accuracy)}m</span>
        <span className={`confidence-badge ${getLocationConfidence(employee.accuracy).className}`}>
          {getLocationConfidence(employee.accuracy).label}
        </span>
      </div>

      <div className="detail-item">
        <span className="detail-label">Status</span>
        <span className="detail-value">
          {employee.trackingEnabled ? '✅ Tracking Active' : '❌ Tracking Inactive'}
        </span>
      </div>

      {employee.address && (
        <div className="detail-item full-width">
          <span className="detail-label">Address</span>
          <span className="detail-value address-text">📌 {employee.address}</span>
        </div>
      )}

      <div className="detail-item full-width">
        <span className="detail-label">Last Update</span>
        <span className="detail-value">{new Date(employee.lastUpdate).toLocaleString()}</span>
      </div>
    </div>
  </div>
);

/**
 * Empty State when no employee is selected
 */
const EmptyDetailsPlaceholder: React.FC = () => (
  <div className="empty-details-placeholder">
    <div className="placeholder-icon">📍</div>
    <h3>Select an Employee</h3>
    <p>Click on a marker on the map to view employee details.</p>
  </div>
);

export default EmployeeLocationManagement;
