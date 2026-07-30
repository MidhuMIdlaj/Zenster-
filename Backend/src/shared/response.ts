import { Response } from 'express';
import { StatusCode } from './enums/statusCode';

export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message?: string;
  data?: T;
  error?: string;
  [key: string]: unknown;
}

export const buildResponse = <T = unknown>(payload: Partial<ApiResponse<T>> & { success: boolean; statusCode?: number }) => {
  const statusCode = payload.statusCode ?? (payload.success ? StatusCode.OK : StatusCode.BAD_REQUEST);
  const { success, message, data, error, ...rest } = payload;
  return {
    success,
    statusCode,
    message,
    data,
    error,
    ...rest,
  } as ApiResponse<T>;
};

export const sendResponse = <T = unknown>(res: Response, payload: Partial<ApiResponse<T>> & { success: boolean; statusCode?: number }) => {
  const response = buildResponse(payload);
  return res.status(response.statusCode).json(response);
};

export const sendSuccess = <T = unknown>(res: Response, data?: T, message?: string, statusCode: StatusCode = StatusCode.OK, extra: Record<string, unknown> = {}) =>
  sendResponse(res, { success: true, statusCode, message, data, ...extra });

export const sendError = (res: Response, message: string, statusCode: StatusCode = StatusCode.BAD_REQUEST, error?: string, data?: unknown, extra: Record<string, unknown> = {}) =>
  sendResponse(res, { success: false, statusCode, message, error: error ?? message, data, ...extra });
