import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface LocationState {
  isTracking: boolean;
  hasPermission: boolean;
  permissionGranted: boolean;
  lastLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: string;
    address?: string;
  };
  updateInterval: number; // in seconds
  failureCount: number;
  lastError?: string;
  isLoading: boolean;
  showPermissionModal: boolean;
}

const initialState: LocationState = {
  isTracking: false,
  hasPermission: false,
  permissionGranted: false,
  updateInterval: 180, // 3 minutes
  failureCount: 0,
  isLoading: false,
  showPermissionModal: false,
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    // Tracking state
    setTracking(state, action: PayloadAction<boolean>) {
      state.isTracking = action.payload;
    },

    // Permission state
    setHasPermission(state, action: PayloadAction<boolean>) {
      state.hasPermission = action.payload;
    },

    setPermissionGranted(state, action: PayloadAction<boolean>) {
      state.permissionGranted = action.payload;
    },

    setShowPermissionModal(state, action: PayloadAction<boolean>) {
      state.showPermissionModal = action.payload;
    },

    // Location data
    setLastLocation(
      state,
      action: PayloadAction<{
        latitude: number;
        longitude: number;
        accuracy: number;
        address?: string;
      }>
    ) {
      state.lastLocation = {
        ...action.payload,
        timestamp: new Date().toISOString(),
      };
    },

    // Update interval (in seconds)
    setUpdateInterval(state, action: PayloadAction<number>) {
      state.updateInterval = action.payload;
    },

    // Error handling
    setLastError(state, action: PayloadAction<string | undefined>) {
      state.lastError = action.payload;
    },

    setFailureCount(state, action: PayloadAction<number>) {
      state.failureCount = action.payload;
    },

    resetError(state) {
      state.lastError = undefined;
      state.failureCount = 0;
    },

    // Loading state
    setIsLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },

    // Reset all location state
    resetLocationState(state) {
      return initialState;
    },
  },
});

export const {
  setTracking,
  setHasPermission,
  setPermissionGranted,
  setShowPermissionModal,
  setLastLocation,
  setUpdateInterval,
  setLastError,
  setFailureCount,
  resetError,
  setIsLoading,
  resetLocationState,
} = locationSlice.actions;

export default locationSlice.reducer;
