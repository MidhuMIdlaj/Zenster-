// src/utils/authUtils.ts
import axios from 'axios';
import { store, persistor } from '../store/Store';
import { clearEmployeeAuth } from '../store/EmployeeAuthSlice';

export const refreshToken = async () => {
  try {
    // 1. Call your refresh token endpoint
    const response = await axios.post(
      'http://localhost:3000/auth/refresh-token', 
      {},
      { withCredentials: true }
    );

    const { accessToken, userType } = response.data;

    // 2. Update Redux store based on user type
    if (userType === 'admin') {
      store.dispatch({
        type: 'adminAuth/setAdminAuth',
        payload: {
          ...store.getState().adminAuth.adminData,
          token: accessToken
        }
      });
    } else {
      store.dispatch({
        type: 'employeeAuth/setEmployeeAuth',
        payload: {
          ...store.getState().employeeAuth.employeeData,
          token: accessToken
        }
      });
    }

    return accessToken;
  } catch (error) {
    // 3. If refresh fails, logout both users
    store.dispatch({ type: 'adminAuth/clearAdminAuth' });
    store.dispatch({ type: 'employeeAuth/clearEmployeeAuth' });
    throw error;
  }
};

export const clearEmployeeSessionSync = () => {
  store.dispatch(clearEmployeeAuth());
  if (typeof window === 'undefined') return;

  localStorage.removeItem('employeeData');
  localStorage.removeItem('token');
  localStorage.removeItem('persist:root');
  document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
};

export const clearEmployeeSession = async () => {
  clearEmployeeSessionSync();

  try {
    await persistor.purge();
  } catch (err) {
    console.error('Failed to purge persisted storage:', err);
  }
};
