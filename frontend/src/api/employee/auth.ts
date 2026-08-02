import axios, { AxiosResponse } from "axios";
import { ResetPasswordEmailFormData, responseData } from "../../types/dashboard";
import { configManager } from '../../config/config';


const BASE_URL = configManager.getApiEndpoint('/employee');

export interface EmployeeLoginResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: {
    token: string;
    id: string;
    position: string;
    employeeName: string;
  };
}

export const EmployeeLoginApi = async (
    email: string,
    password: string
  ): Promise<AxiosResponse<responseData>> => {
    try {
      const response = await axios.post<EmployeeLoginResponse>(
        `${BASE_URL}/loginEmployee`,
        { email, password },
        { withCredentials: true }
      );
      return response;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response as AxiosResponse<EmployeeLoginResponse>;
      }
      throw new Error("Oops something went wrong");
    }
  };

export const ResetPasswordEmailApi = async (
    email: string,
): Promise<AxiosResponse<ResetPasswordEmailFormData>> => {
    try {
      const response = await axios.post<ResetPasswordEmailFormData>(
        `${BASE_URL}/requestResetPassword`,
        { email},
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

  export const VerifyOtpApi = async (
    email: string,
    otp : string,
): Promise<AxiosResponse<ResetPasswordEmailFormData>> => {
    try {
      const response = await axios.post<ResetPasswordEmailFormData>(
        `${BASE_URL}/verifyOtp`,
        { email , otp},
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

  export const ResetPasswordApi = async (
    email: string,
    password : string,
): Promise<AxiosResponse<ResetPasswordEmailFormData>> => {
    try {
      const response = await axios.post<ResetPasswordEmailFormData>(
        `${BASE_URL}/resetPassword`,
        { email , password},
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