import axios, { AxiosResponse } from "axios";
import {  ResetPasswordEmailFormData } from "../../types/dashboard";
import  {responseData}  from "../../types/dashboard";
import { configManager } from '../../config/config';


const BASE_URL = configManager.getApiEndpoint('/employee');

export const EmployeeLoginApi = async (
    email: string,
    password: string
  ): Promise<AxiosResponse<responseData>> => {
    try {
      const response = await axios.post<responseData>(
        `${BASE_URL}/loginEmployee`,
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