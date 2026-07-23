import axios from 'axios';
import { store } from '../store/Store';
import { clearAdminAuth } from '../store/AdminAuthSlice';
import { clearEmployeeAuth } from '../store/EmployeeAuthSlice';
import { configManager } from '../config/config';

const axiosInstance = axios.create({
  baseURL: configManager.getApiBaseUrl(),
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  // Get token from localStorage or Redux store
  const employeeData = JSON.parse(localStorage.getItem('employeeData') || '{}');
  const token = employeeData.token || localStorage.getItem('token');
  
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
      
      try {
        const response = await axios.post(
          `${configManager.getApiBaseUrl()}/admin/refresh-token`,
          {},
          { withCredentials: true }
        ); 
        
        const newToken = response.data.accessToken;
        const employeeData = JSON.parse(localStorage.getItem('employeeData') || '{}');
        employeeData.token = newToken;
        localStorage.setItem('employeeData', JSON.stringify(employeeData));
        
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        store.dispatch(clearAdminAuth());
        store.dispatch(clearEmployeeAuth());
        localStorage.removeItem('employeeData');
        localStorage.removeItem('token');
        window.location.href = '/employee-login';
        return Promise.reject(refreshError);
      }
    }

     if (error.response?.status === 403 && error.response.data?.shouldLogout) {
      store.dispatch(clearEmployeeAuth());
      localStorage.removeItem('employeeData');
      localStorage.removeItem('token');
      window.location.href = '/employee-login'; 
      return Promise.reject(error);
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;