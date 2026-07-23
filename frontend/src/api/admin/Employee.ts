import axios from "axios";
import axiosInstance from "../axiosInstance";
import { configManager } from '../../config/config';
const API_BASE_URL = configManager.getApiEndpoint('/admin');

export interface EmployeeFormData {
  id?: string;
  date: string;
  emailId: string;
  employeeName: string;
  joinDate: string;
  contactNumber: string;
  address: string;
  position: 'coordinator' | 'mechanic';
  employeeAddress: string;
  currentSalary: string;
  age: string;
  previousJob: string;
  experience: string;
  status?: 'active' | 'inactive';
  isDeleted?: boolean;
  fieldOfMechanic: string[];
}

export interface EmployeeResponse extends EmployeeFormData {
  employeeId: string;
  status: 'active' | 'inactive';
}


const handleApiError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      const errorMessage = error.response.data.message || "Request failed";
      throw new Error(errorMessage);
    }
    if (error.request) {
      throw new Error("Server not responding. Please check your connection.");
    }
  }
  throw new Error(error instanceof Error ? error.message : "Unknown error occurred");
};

// Create Employee
export const createEmployee = async (data: EmployeeFormData): Promise<any> => {
  try {
    const response = await axiosInstance.post(
      `${API_BASE_URL}/createEmployee`,
      data
    );
    return response.data;
  } catch (error) {
    console.error("Create Employee Error:", error);
    return handleApiError(error);
  }
};

// Get All Employees
export const fetchEmployees = async (page: number = 1, limit: number = 10) => {
  try {
    const response = await axiosInstance.get(`${API_BASE_URL}/getAllEmployees`, {
      params: { 
        page, 
        limit,
      },
    });
    if (response.data.success) {
      return response.data; 
    } else {
      throw new Error(response.data.message || "Failed to fetch employees");
    }
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw error; 
  }
};

export const searchEmployeesApi = async (
  searchTerm: string,
  status: 'all' | 'active' | 'inactive',
  position: 'all' | 'coordinator' | 'mechanic',
  page: number,
  limit: number
) => {
  try {
    const response = await axiosInstance.get(`${API_BASE_URL}/searchEmployee`, {
      params: {
        searchTerm,
        status: status === 'all' ? undefined : status,
        position: position === 'all' ? undefined : position,
        page,
        limit
      }
    });
    return {
      success: response.data.success || true,
      employees: response.data.employees || [],
      total: response.data.total || 0,
      totalPages: response.data.totalPages || 1,
      currentPage: response.data.currentPage || page
    };
  } catch (error) {
    console.error('Error searching employees:', error);
    return {
      success: false,
      employees: [],
      total: 100,
      totalPages: 10,
      currentPage: 1
    };
  }
};

// Update Employee
export const updateEmployee = async (
  id: string, 
  data: EmployeeFormData
): Promise<any> => {
  try {
    const response = await axiosInstance.put(
      `${API_BASE_URL}/editEmployee/${id}`,
      data
    );
    return response.data;
  } catch (error) {
    console.error("Update Employee Error:", error);
    return handleApiError(error);
  }
};

// Delete Employee
export const deleteEmployee = async (id: string): Promise<void> => {
  try {
    await axiosInstance.patch(
      `${API_BASE_URL}/softDeleteEmployee/${id}`
    );
  } catch (error) {
    console.error("Delete Employee Error:", error);
    return handleApiError(error);
  }
};

// Update Employee Status
export const updateEmployeeStatus = async (
  id: string,
  status: 'active' | 'inactive'
): Promise<any> => {
  try {
    const response = await axiosInstance.patch(
      `${API_BASE_URL}/updateEmployeeStatus/${id}`,
      { status }
    );
    return response.data;
  } catch (error) {
    console.error("Update Status Error:", error);
    return handleApiError(error);
  }
};


export const getAllAdmin = async (page: number = 1, limit: number = 10) => {
  try {
    const response = await axiosInstance.get(`${API_BASE_URL}/getAllAdmins`, {
      params: { 
        page, 
        limit,
      },
      withCredentials: true,
    });
    if (response.data.success) {
      return response.data; 
    } else {
      throw new Error(response.data.message || "Failed to fetch employees");
    }
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw error; 
  }
}
