import { IAdminRepository } from "../../../domain/Repository/i-admin-repository";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { inject, injectable } from "inversify";
import { TYPES } from "../../../types";
import { ResponseDTO } from "../../../domain/dtos/Response";
import { ILoginAdminUseCase } from "../../interface/admin/admin/admin-auth-usecase-interface";

export interface AdminLoginResponse {
  accessToken: string;
  email: string;
  id: string;
  role: string;
}

@injectable()
export default class LoginAdminUseCase implements ILoginAdminUseCase{
  constructor(
    @inject(TYPES.IAdminRepository) private adminRepo: IAdminRepository
  ) {}

  async execute(email: string, password: string): Promise<ResponseDTO<AdminLoginResponse>> {
    const admin = await this.adminRepo.findByEmail(email);
    if (!admin) {
      return {
        success: false,
        message: "Admin not found",
        statusCode: 404
      };
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return {
        success: false,
        message: "Invalid password",
        statusCode: 401
      };
    }

    const token = jwt.sign(
      { userId: admin._id.toString(), email: admin.email, role: "admin" },
      process.env.JWT_SECRET!,
      { expiresIn: "24h" }
    );

    return {
      success: true,
      message: "Admin logged in successfully",
      statusCode: 200,
      data: {
        accessToken: token,
        email: admin.email,
        id: admin._id.toString(),
        role: "admin"
      }
    };
  }
}
