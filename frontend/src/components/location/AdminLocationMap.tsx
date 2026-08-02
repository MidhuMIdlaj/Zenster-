import React, { useEffect, useState, useCallback } from 'react';
import { useGoogleMaps, useMapMarkers, useMapInfoWindows } from '../../hooks/useGoogleMaps';
import { RealTimeLocationService } from '../../services/location/realtime-location-service';
import { EmployeeLocationWithStatus, LocationFilterOptions } from '../../types/location-types';
import { configManager } from '../../config/config';
import './LocationMapContainer.css';

interface AdminLocationMapProps {
  onEmployeeSelected?: (employeeId: string, location: EmployeeLocationWithStatus) => void;
  autoRefreshInterval?: number;
  showFilters?: boolean;
  markerCluster?: boolean;
}

export const AdminLocationMap: React.FC<AdminLocationMapProps> = ({
  onEmployeeSelected,
  autoRefreshInterval = 30000,
  showFilters = true,
  markerCluster = true,
}) => {
  const { mapContainerRef, panToLocation, fitBoundsToMarkers } = useGoogleMaps({
    center: { lat: 40.7128, lng: -74.006 },
    zoom: 12,
  });

  const { addMarker, removeMarker, updateMarkerPosition, clearAllMarkers } = useMapMarkers();
  const { showInfoWindow, createInfoContent } = useMapInfoWindows();

  const [employees, setEmployees] = useState<EmployeeLocationWithStatus[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeLocationWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const [filters, setFilters] = useState<LocationFilterOptions>({
    statusFilter: 'all',
    searchText: '',
  });

  // Initialize real-time location service
  useEffect(() => {
    const locationService = RealTimeLocationService.getInstance();

    // Start polling if not already started
    if (!locationService.isPollingActive()) {
      locationService.startPolling(autoRefreshInterval);
    }

    // Subscribe to location updates
    const unsubscribe = locationService.onLocationsUpdated((locations) => {
      setEmployees(locations);
      setIsLoading(false);
      setMapReady(true);
    });

    // Fetch initial locations
    const fetchInitialLocations = async () => {
      try {
        const response = await fetch(`${configManager.getApiBaseUrl()}/location/all-current`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await response.json();
        if (data.locations) {
          const formattedLocations: EmployeeLocationWithStatus[] = data.locations.map(
            (loc: any) => ({
              employeeId: loc.employeeId,
              employeeName: loc.employeeName,
              latitude: loc.latitude,
              longitude: loc.longitude,
              accuracy: loc.accuracy,
              address: loc.address,
              timestamp: new Date(loc.lastUpdate),
              trackingEnabled: loc.trackingEnabled,
              lastUpdate: new Date(loc.lastUpdate),
              status: loc.status,
              distanceTraveled: loc.distanceTraveled,
            })
          );
          setEmployees(formattedLocations);
        }
      } catch (err) {
        console.error('Error fetching locations:', err);
        setError('Unable to fetch employee locations');
      } finally {
        setIsLoading(false);
        setMapReady(true);
      }
    };

    fetchInitialLocations();

    // Return cleanup
    return () => {
      unsubscribe?.();
    };
  }, [autoRefreshInterval]);

  // Apply filters
  useEffect(() => {
    let filtered = [...employees];

    // Filter by search text
    if (filters.searchText) {
      filtered = filtered.filter((emp) =>
        emp.employeeName?.toLowerCase().includes(filters.searchText!.toLowerCase())
      );
    }

    // Filter by status
    if (filters.statusFilter && filters.statusFilter !== 'all') {
      filtered = filtered.filter((emp) => emp.status === filters.statusFilter);
    }

    // Sort by latest update first so the newest employee appears first in the list.
    filtered = filtered.sort(
      (a, b) => b.lastUpdate.getTime() - a.lastUpdate.getTime()
    );

    setFilteredEmployees(filtered);
  }, [employees, filters]);

  // Update markers on map
  useEffect(() => {
    if (!mapReady) return;

    clearAllMarkers();

    filteredEmployees.forEach((employee) => {
      const markerColor = employee.status === 'active' ? '#10b981' : '#ef4444';

      const marker = addMarker(`employee-${employee.employeeId}`, {
        position: {
          lat: employee.latitude,
          lng: employee.longitude,
        },
        title: employee.employeeName || employee.employeeId,
        label: employee.employeeName ? employee.employeeName.charAt(0).toUpperCase() : 'E',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: markerColor,
          fillOpacity: 0.8,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
        infoContent: createInfoContent({
          employeeId: employee.employeeId,
          name: employee.employeeName || 'Unknown',
          position: {
            lat: employee.latitude,
            lng: employee.longitude,
          },
          address: employee.address || 'Address not available',
          accuracy: employee.accuracy,
          lastUpdate: employee.lastUpdate,
          status: employee.status,
        }),
      });

      // Add click listener
      if (marker) {
        marker.addListener('click', () => {
          showInfoWindow(
            `info-${employee.employeeId}`,
            createInfoContent({
              employeeId: employee.employeeId,
              name: employee.employeeName || 'Unknown',
              position: {
                lat: employee.latitude,
                lng: employee.longitude,
              },
              address: employee.address || 'Address not available',
              accuracy: employee.accuracy,
              lastUpdate: employee.lastUpdate,
              status: employee.status,
            }),
            {
              lat: employee.latitude,
              lng: employee.longitude,
            }
          );

          onEmployeeSelected?.(employee.employeeId, employee);
        });
      }
    });

    // Fit all markers in view
    if (filteredEmployees.length > 0) {
      fitBoundsToMarkers();
    }
  }, [filteredEmployees, mapReady, addMarker, clearAllMarkers, showInfoWindow, createInfoContent, fitBoundsToMarkers, onEmployeeSelected]);

  return (
    <div className="admin-location-map-container">
      <div className="map-header">
        <h2>📊 Employee Locations</h2>
        <div className="header-stats">
          <span className="stat">
            <strong>{filteredEmployees.filter((e) => e.status === 'active').length}</strong> Active
          </span>
          <span className="stat">
            <strong>{filteredEmployees.filter((e) => e.status === 'inactive').length}</strong> Inactive
          </span>
          <span className="stat">
            <strong>{filteredEmployees.length}</strong> Total
          </span>
        </div>
      </div>

      {showFilters && (
        <div className="map-filters">
          <input
            type="text"
            placeholder="Search employee..."
            value={filters.searchText || ''}
            onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
            className="search-input"
          />

          <select
            value={filters.statusFilter || 'all'}
            onChange={(e) => setFilters({ ...filters, statusFilter: e.target.value as any })}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      )}

      <div className="map-wrapper" ref={mapContainerRef} style={{ height: '600px' }} />

      {isLoading && (
        <div className="map-overlay loading">
          <div className="spinner"></div>
          <p>Loading employee locations...</p>
        </div>
      )}

      {error && (
        <div className="map-overlay error">
          <p>{error}</p>
        </div>
      )}

      {filteredEmployees.length > 0 && (
        <div className="employee-list-panel">
          <h3>Employees on Map ({filteredEmployees.length})</h3>
          <div className="employee-list">
            {filteredEmployees.map((employee) => (
              <div
                key={employee.employeeId}
                className={`employee-list-item status-${employee.status}`}
                onClick={() => {
                  panToLocation(employee.latitude, employee.longitude, 15);
                  onEmployeeSelected?.(employee.employeeId, employee);
                }}
              >
                <div className="employee-item-header">
                  <span className="employee-name">{employee.employeeName || employee.employeeId}</span>
                  <span className={`status-badge ${employee.status}`}>{employee.status}</span>
                </div>
                <div className="employee-item-details">
                  <span className="detail">
                    📍 {employee.latitude.toFixed(4)}, {employee.longitude.toFixed(4)}
                  </span>
                  <span className="detail">
                    🎯 ±{Math.round(employee.accuracy)}m
                  </span>
                  <span className="detail">
                    ⏰ {employee.lastUpdate.toLocaleTimeString()}
                  </span>
                </div>
                {employee.address && (
                  <div className="employee-item-address">
                    📌 {employee.address}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredEmployees.length === 0 && !isLoading && (
        <div className="no-data">
          <p>No employees with location data</p>
        </div>
      )}
    </div>
  );
};

export default AdminLocationMap;

