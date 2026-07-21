export interface ResponseDTO<T = any> {

  success: boolean;

  data?: T;

  message?: string;

  statusCode: number;
}