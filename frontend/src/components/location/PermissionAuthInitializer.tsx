import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { RootState } from '../../store/Store';
import LocationPermissionDialog from './LocationPermissionDialog';
import useLocationPermission from '../../hooks/useLocationPermission';
import { LocationTrackingService } from '../../services/location-tracking-service';
import { resetLocationState } from '../../store/locationSlice';

interface PermissionAuthInitializerProps {
  children: React.ReactNode;
}

/**
 * AuthInitializer with Location Permission Dialog
 * Shows permission dialog to employees after login
 */
export const PermissionAuthInitializer: React.FC<PermissionAuthInitializerProps> = ({ children }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [permissionAskedInSession, setPermissionAskedInSession] = useState(false);

  // Get specific auth state - only select what we need to avoid unnecessary rerenders
  const employeeAuth = useSelector((state: RootState) => {
    const s = state as any;
    return s?.employeeAuth;
  });

  const employeeData = employeeAuth?.employeeData;
  const isEmployeeAuthenticated = Boolean(employeeAuth?.isAuthenticated && employeeData?.token);
  const isEmployeeArea = [
    '/coordinator',
    '/mechanic',
    '/user-management',
    '/complaint-management',
    '/employee-chat',
    '/employee/profile',
  ].some((path) => location.pathname.startsWith(path));

  // Use location permission hook only when the employee is authenticated and inside employee area
  const { isPermissionAsked, requestPermission } = useLocationPermission(
    isEmployeeAuthenticated && isEmployeeArea
  );

  // Show permission dialog only for employees who are newly logged in
  useEffect(() => {
    if (
      isEmployeeAuthenticated &&
      isEmployeeArea &&
      !isPermissionAsked &&
      !permissionAskedInSession &&
      !showPermissionDialog
    ) {
      // Small delay to ensure UI is ready
      setTimeout(() => {
        setShowPermissionDialog(true);
        setPermissionAskedInSession(true);
      }, 1000);
    }
  }, [isEmployeeAuthenticated, isEmployeeArea, isPermissionAsked, permissionAskedInSession, showPermissionDialog]);

  useEffect(() => {
    if (!isEmployeeAuthenticated || !isEmployeeArea) {
      setShowPermissionDialog(false);
      setPermissionAskedInSession(false);
      LocationTrackingService.getInstance().stopTracking();
      dispatch(resetLocationState());
    }
  }, [dispatch, isEmployeeAuthenticated, isEmployeeArea]);

  const handleGrantPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      const trackingService = LocationTrackingService.getInstance();
      trackingService.setPermissionStatus(true);
      await trackingService.startTracking();
      setShowPermissionDialog(false);
    }
  };

  const handleDenyPermission = () => {
    setShowPermissionDialog(false);
    // User denied - they can grant later from settings
  };

  return (
    <>
      {children}
      <LocationPermissionDialog
        isOpen={showPermissionDialog}
        onGrant={handleGrantPermission}
        onDeny={handleDenyPermission}
        employeeName={employeeData?.employeeName || 'Employee'}
      />
    </>
  );
};

export default PermissionAuthInitializer;
