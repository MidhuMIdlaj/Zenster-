// src/api/clientApi.ts
import axiosInstance from "../axiosInstance";
import { configManager } from '../../config/config';

const API_BASE_URL = configManager.getApiEndpoint('/admin');


export const ClientApi = async (data: any): Promise<any> => {
  try {
    const response = await axiosInstance.post(
      `${API_BASE_URL}/createUser`, 
      data,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Client API error", error);
    throw error;
  }
};

export const ClientListApi = async (page: number = 1, limit: number = 10) => {
  try {
    const response = await axiosInstance.get(`${API_BASE_URL}/getAllClients`, {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
};



export const UpdateClientStatusApi = async (clientId: string, status: string): Promise<any> => {
  try {
    const response = await axiosInstance.patch(
      `${API_BASE_URL}/updateStatusClient/${clientId}`,
      { status },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Update Status API error", error);
    throw error;
  }
}



export const UpdateClientApi = async (id: string, data: any): Promise<any> => {
  try {
    const response = await axiosInstance.patch(
      `${API_BASE_URL}/editClient/${id}`,
      data, 
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Update Client API error", error);
    throw error;
  }
};


export const getClientById = async (id: string): Promise<any> => {
  try {
    const response = await axiosInstance.get(
      `${API_BASE_URL}/getClient/${id}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Get Client API error", error);
    throw error;
  }
};
export const softDeleteClientApi = async (clientId: string): Promise<any> => {
  try {
    const url = `${API_BASE_URL}/softDeleteUser/${clientId}`;
   
    const response = await axiosInstance.patch(url, {}, {
      headers: {
        'Content-Type': 'application/json',
      },
      validateStatus: (status) => status < 500  
    });

    
    if (response.status === 404) {
      throw new Error(`Endpoint not found: ${url}`);
    }

    return response.data;
  } catch (error: any) {
    console.error("Complete error details:", {
      message: error.message,
      config: error.config,
      response: error.response?.data
    });
    throw error;
  }
};

export const searchClientsApi = async (
  searchTerm: string,
  status: 'all' | 'active' | 'inactive',
  page: number,
  limit: number
) => {
  try {
    const response = await axiosInstance.get(`${API_BASE_URL}/search`, {
      params: {
        searchTerm,
        status: status === 'all' ? undefined : status,
        page,
        limit
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching clients:', error);
    throw error;
  }
};