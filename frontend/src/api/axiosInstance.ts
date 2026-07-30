import axios from 'axios';
import { store } from '../store/Store';
import { clearAdminAuth, setAdminAuth } from '../store/AdminAuthSlice';
import { clearEmployeeSession } from '../utils/authUtils';
import { configManager } from '../config/config';

const axiosInstance = axios.create({
  baseURL: configManager.getApiBaseUrl(),
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  // Get token from localStorage or Redux store
  const employeeData = JSON.parse(localStorage.getItem('employeeData') || '{}');
  let adminData: { token?: string } = {};

  try {
    const persistedRoot = JSON.parse(localStorage.getItem('persist:root') || '{}');
    const adminAuth = persistedRoot.adminAuth ? JSON.parse(persistedRoot.adminAuth) : {};
    adminData = adminAuth.adminData || {};
  } catch (error) {
    adminData = {};
  }

  const token = employeeData.token || adminData.token;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const requestUrl = originalRequest.url || '';
      const isAdminRequest = typeof requestUrl === 'string' && requestUrl.startsWith('/admin');
      const hasEmployeeToken = Boolean(store.getState().employeeAuth.employeeData?.token);
      const hasAdminToken = Boolean(store.getState().adminAuth.adminData?.token);

      if (!isAdminRequest || hasEmployeeToken || !hasAdminToken) {
        await clearEmployeeSession();
        return Promise.reject(error);
      }
      
      try {
        const response = await axios.post(
          `${configManager.getApiBaseUrl()}/admin/refresh-token`,
          {},
          { withCredentials: true }
        ); 
        
        const newToken = response.data.accessToken;
        const adminData = store.getState().adminAuth.adminData;
        if (adminData) {
          store.dispatch(setAdminAuth({ ...adminData, token: newToken }));
          localStorage.setItem('token', newToken);
        }
        
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        store.dispatch(clearAdminAuth());
        await clearEmployeeSession();
        window.location.href = '/employee-login';
        return Promise.reject(refreshError);
      }
    }

     if (error.response?.status === 403 && error.response.data?.shouldLogout) {
      await clearEmployeeSession();
      window.location.href = '/employee-login'; 
      return Promise.reject(error);
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
