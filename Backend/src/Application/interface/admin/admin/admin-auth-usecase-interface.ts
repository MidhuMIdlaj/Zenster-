import { AdminLoginResponse } from "../../../../domain/dtos/Admin-usecase/admin-login-response-usecase-interface";
import { ResponseDTO } from "../../../../domain/dtos/Response";

export interface ILoginAdminUseCase {
  execute(email: string, password: string): Promise<ResponseDTO<AdminLoginResponse>>;
} 