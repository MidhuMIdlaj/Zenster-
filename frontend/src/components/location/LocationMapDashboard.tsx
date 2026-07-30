/**
 * Location Map Dashboard Integration Example
 * Shows how to use employee and admin location maps together
 */

import React, { useState } from 'react';
import { useAppSelector } from '../../store/Store';
import { EmployeeLocationMap } from './EmployeeLocationMap';
import { AdminLocationMap } from './AdminLocationMap';
import { EmployeeLocationWithStatus } from '../../types/location-types';

interface LocationMapDashboardProps {
  employeeId: string;
  employeeName: string;
  userRole?: 'employee' | 'coordinator' | 'admin';
  onEmployeeSelected?: (employeeId: string) => void;
}

export const LocationMapDashboard: React.FC<LocationMapDashboardProps> = ({
  employeeId,
  employeeName,
  userRole = 'employee',
  onEmployeeSelected,
}) => {
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeLocationWithStatus | null>(null);
  const [mapView, setMapView] = useState<'personal' | 'team'>('personal');

  const handleEmployeeSelected = (empId: string, location: EmployeeLocationWithStatus) => {
    setSelectedEmployee(location);
    onEmployeeSelected?.(empId);
  };

  // Show different views based on user role
  const isAdmin = userRole === 'admin' || userRole === 'coordinator';

  return (
    <div style={styles.container}>
      {isAdmin ? (
        <>
          {/* Admin Dashboard */}
          <div style={styles.header}>
            <h1 style={styles.title}>Location Management Dashboard</h1>
            <div style={styles.viewToggle}>
              <button
                onClick={() => setMapView('personal')}
                style={{
                  ...styles.toggleButton,
                  ...(mapView === 'personal' ? styles.toggleButtonActive : {}),
                }}
              >
                Personal Map
              </button>
              <button
                onClick={() => setMapView('team')}
                style={{
                  ...styles.toggleButton,
                  ...(mapView === 'team' ? styles.toggleButtonActive : {}),
                }}
              >
                Team View
              </button>
            </div>
          </div>

          {mapView === 'personal' ? (
            <div style={styles.mapWrapper}>
              <EmployeeLocationMap
                employeeId={employeeId}
                employeeName={employeeName}
                showAccuracyCircle={true}
                showAddressInfo={true}
              />
            </div>
          ) : (
            <div style={styles.mapWrapper}>
              <AdminLocationMap
                autoRefreshInterval={30000}
                showFilters={true}
                onEmployeeSelected={handleEmployeeSelected}
              />
            </div>
          )}

          {/* Selected Employee Details */}
          {selectedEmployee && mapView === 'team' && (
            <div style={styles.detailsPanel}>
              <h3 style={styles.detailsTitle}>Selected Employee Details</h3>
              <div style={styles.detailsGrid}>
                <DetailItem label="Name" value={selectedEmployee.employeeName || 'N/A'} />
                <DetailItem label="Latitude" value={selectedEmployee.latitude.toFixed(6)} />
                <DetailItem label="Longitude" value={selectedEmployee.longitude.toFixed(6)} />
                <DetailItem label="Accuracy" value={`±${Math.round(selectedEmployee.accuracy)}m`} />
                <DetailItem label="Status" value={selectedEmployee.status} />
                <DetailItem
                  label="Last Update"
                  value={selectedEmployee.lastUpdate.toLocaleTimeString()}
                />
                {selectedEmployee.address && (
                  <DetailItem label="Address" value={selectedEmployee.address} />
                )}
                {selectedEmployee.distanceTraveled && (
                  <DetailItem
                    label="Distance Traveled"
                    value={`${selectedEmployee.distanceTraveled.toFixed(2)} km`}
                  />
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Employee View */}
          <div style={styles.header}>
            <h1 style={styles.title}>My Location</h1>
          </div>
          <div style={styles.mapWrapper}>
            <EmployeeLocationMap
              employeeId={employeeId}
              employeeName={employeeName}
              showAccuracyCircle={true}
              showAddressInfo={true}
              autoFit={true}
            />
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Detail Item Component
 */
interface DetailItemProps {
  label: string;
  value: string | number;
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value }) => (
  <div style={styles.detailItem}>
    <span style={styles.detailLabel}>{label}:</span>
    <span style={styles.detailValue}>{value}</span>
  </div>
);

/**
 * Advanced Integration Example with Real-time Updates
 */
export const LocationMapDashboardAdvanced: React.FC<LocationMapDashboardProps> = ({
  employeeId,
  employeeName,
  userRole = 'employee',
}) => {
  const [updateInterval, setUpdateInterval] = useState(30);
  const [showHistory, setShowHistory] = useState(false);
  const [showGeofence, setShowGeofence] = useState(false);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📍 Advanced Location Tracking</h1>
      </div>

      <div style={styles.controlPanel}>
        <div style={styles.controlGroup}>
          <label style={styles.label}>Update Interval (seconds):</label>
          <input
            type="range"
            min="10"
            max="120"
            value={updateInterval}
            onChange={(e) => setUpdateInterval(parseInt(e.target.value))}
            style={styles.slider}
          />
          <span style={styles.value}>{updateInterval}s</span>
        </div>

        <div style={styles.controlGroup}>
          <label style={styles.checkbox}>
            <input
              type="checkbox"
              checked={showHistory}
              onChange={(e) => setShowHistory(e.target.checked)}
            />
            Show Location History
          </label>
        </div>

        <div style={styles.controlGroup}>
          <label style={styles.checkbox}>
            <input
              type="checkbox"
              checked={showGeofence}
              onChange={(e) => setShowGeofence(e.target.checked)}
            />
            Show Geofence
          </label>
        </div>
      </div>

      <div style={styles.mapWrapper}>
        {userRole === 'employee' ? (
          <EmployeeLocationMap
            employeeId={employeeId}
            employeeName={employeeName}
            showAccuracyCircle={true}
            showAddressInfo={true}
          />
        ) : (
          <AdminLocationMap autoRefreshInterval={updateInterval * 1000} showFilters={true} />
        )}
      </div>
    </div>
  );
};

// Styles
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #e2e8f0',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 600 as const,
    color: '#1e293b',
  },
  viewToggle: {
    display: 'flex',
    gap: '8px',
  },
  toggleButton: {
    padding: '8px 16px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    backgroundColor: '#fff',
    color: '#475569',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500 as const,
    transition: 'all 0.2s ease',
  },
  toggleButtonActive: {
    backgroundColor: '#667eea',
    color: '#fff',
    borderColor: '#667eea',
  },
  controlPanel: {
    display: 'flex',
    gap: '24px',
    padding: '16px 20px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #e2e8f0',
    flexWrap: 'wrap' as const,
  },
  controlGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600 as const,
    color: '#475569',
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#475569',
    cursor: 'pointer',
  },
  slider: {
    width: '100px',
  },
  value: {
    fontSize: '13px',
    fontWeight: 500 as const,
    color: '#667eea',
    minWidth: '40px',
  },
  mapWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  detailsPanel: {
    backgroundColor: '#fff',
    borderTop: '1px solid #e2e8f0',
    padding: '16px 20px',
    maxHeight: '250px',
    overflowY: 'auto' as const,
  },
  detailsTitle: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    fontWeight: 600 as const,
    color: '#1e293b',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '12px',
  },
  detailItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 12px',
    backgroundColor: '#f8fafc',
    borderRadius: '6px',
    fontSize: '12px',
  },
  detailLabel: {
    fontWeight: 600 as const,
    color: '#475569',
  },
  detailValue: {
    color: '#64748b',
    fontFamily: 'monospace',
  },
};

export default LocationMapDashboard;
