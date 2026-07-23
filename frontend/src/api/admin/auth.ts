import axios, { AxiosResponse } from "axios";
// import createAxiosInstance from "../axiosInstance";
import { Admin } from "../../types/dashboard";
import { configManager } from '../../config/config';

interface ForgotPasswordFormData {
  email: string;
  otp?: string;
  password?: string;
}

export interface AdminResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: {
    accessToken: string;
    email: string;
    id: string;
    role: string;
  };
}

const API_BASE_URL = configManager.getApiEndpoint('/admin');


export const AdminLoginApi = async (
    email: string,
    password: string
  ): Promise<AxiosResponse<AdminResponse>> => {
    try {
      const response = await axios.post<AdminResponse>(
        `${API_BASE_URL}/login`,
        { email, password },
        { withCredentials: true }
      );
      return response
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response;
      }
      throw new Error("Oops something went wrong");
    }
  };
  

  export const ForgotPasswordEmailApi = async (
    email: string,
  ): Promise<AxiosResponse<ForgotPasswordFormData>> => {
    try {
      const response = await axios.post<ForgotPasswordFormData>(
        `${API_BASE_URL}/requestForgotPassword`,
        { email },
        { withCredentials: true }
      );
      return response;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response;
      }
      throw new Error("Oops something went wrong");
    }
  };
  
  export const VerifyAdminOtpApi = async (
    email: string,
    otp: string,
  ): Promise<AxiosResponse<ForgotPasswordFormData>> => {
    try {
      const response = await axios.post<ForgotPasswordFormData>(
        `${API_BASE_URL}/verifyOtp`,
        { email, otp },
        { withCredentials: true }
      );
      return response;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response;
      }
      throw new Error("Oops something went wrong");
    }
  };
  
  export const ResetAdminPasswordApi = async (
    email: string,
    password: string,
  ): Promise<AxiosResponse<ForgotPasswordFormData>> => {
    try {
      const response = await axios.post<ForgotPasswordFormData>(
        `${API_BASE_URL}/resetPassword`,
        { email, password },
        { withCredentials: true }
      );
      return response;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response;
      }
      throw new Error("Oops something went wrong");
    }
  };
  
