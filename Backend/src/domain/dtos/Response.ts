export interface ResponseDTO<T = unknown> {

  success: boolean;

  data?: T;

  message?: string;

  statusCode: number;
}