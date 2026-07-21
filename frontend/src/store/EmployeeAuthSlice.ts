// src/redux/EmployeeAuthSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface EmployeeAuthState {
  isAuthenticated: boolean;
  loading : boolean;
  employeeData:  {
    token: string;
    position : string;
    id  : string;
    employeeName : string
  } | null;
}

const getStoredEmployeeAuth = (): EmployeeAuthState['employeeData'] | null => {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem('employeeData');
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    return parsed?.token ? parsed : null;
  } catch (error) {
    console.error('Failed to restore employee auth from storage:', error);
    return null;
  }
};

const persistEmployeeAuth = (employeeData: EmployeeAuthState['employeeData'] | null) => {
  if (typeof window === 'undefined') return;

  if (employeeData?.token) {
    localStorage.setItem('employeeData', JSON.stringify(employeeData));
    localStorage.setItem('token', employeeData.token);
  } else {
    localStorage.removeItem('employeeData');
    localStorage.removeItem('token');
  }
};

const initialState: EmployeeAuthState = {
  loading : false,
  isAuthenticated: Boolean(getStoredEmployeeAuth()),
  employeeData: getStoredEmployeeAuth(),
};

const employeeAuthSlice = createSlice({
  name: "employeeAuth",
  initialState,
  reducers: {
    setEmployeeAuth: (state, action: PayloadAction<EmployeeAuthState['employeeData']>) => {
      state.isAuthenticated = true;
      state.loading = false;
      state.employeeData = action.payload;
      persistEmployeeAuth(action.payload);
    },
    clearEmployeeAuth: (state) => {
      state.isAuthenticated = false;
      state.loading = false;
      state.employeeData = null;
      persistEmployeeAuth(null);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setEmployeeAuth, clearEmployeeAuth } = employeeAuthSlice.actions;
export default employeeAuthSlice.reducer;