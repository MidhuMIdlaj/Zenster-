import { AdminModel } from "../db/models/Admin/admin.model";
import { IAdminRepository } from "../../domain/Repository/i-admin-repository";
import { Admin } from "../../domain/entities/Admin";
import redisClient from "../../app";
import { IFindAdminByIdResponse } from "../../domain/dtos/Admin-usecase/find-admin-by-id-usecase-interface";
import { IGetAllAdminUsecase } from "../../domain/dtos/Admin-usecase/get-all-admin-usecase-interface";
import { IUpdateProfileUsecase } from "../../domain/dtos/Admin-usecase/update-admin-profile-usecase-interface";

export class AdminRepoImplement implements IAdminRepository {
  async findByEmail(email: string): Promise<Admin | null> {
    const admin = await AdminModel.findOne({ email })
    return admin as Admin | null;
  }
  async storeOTP(email: string, otp: string) {
    await redisClient.set(`adminOtp:${email}`, otp);
  }

  async verifyOTP(email: string, otp: string) {
    const storedOtp = await redisClient.get(`adminOtp:${email}`);
    if (!storedOtp) throw new Error("OTP expired or not found");
    return storedOtp === otp;
  }

  async findAllAdmins(): Promise<Admin[]> {
    const admins = await AdminModel.find({}).lean();

    return admins.map(admin => ({
      _id: admin._id.toString(),
      email: admin.email,
      password: admin.password,
      firstName: admin.firstName,
      lastName: admin.lastName,
      phoneNumber: admin.phoneNumber
    }));
  }

  async findByAdminName(id: string): Promise<string | null> {
    try {
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return null;
      }
      const admin = await AdminModel.findOne({
        _id: id,
      });
      if (!admin) {
        return null;
      }
      return admin.firstName;
    } catch (error: unknown) {
      console.error(
        "Error finding employee by ID:",
        error instanceof Error ? error.message : error
      );
      throw new Error("Failed to retrieve employee");
    }
  }

  async updatePassword(email: string, hashedPassword: string) {
    const res = await AdminModel.updateOne(
      { email: email },
      { password: hashedPassword }
    );
  }

  async getAllAdmins(page: number = 1, limit: number = 10): Promise<{ admins: IGetAllAdminUsecase[]; total: number }> {
    const skip = (page - 1) * limit;

    const [admins, total] = await Promise.all([
      AdminModel.find({})
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      AdminModel.countDocuments({})
    ]);

    return {
      admins: admins.map(admin => ({
        id: admin._id.toString(),
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        phoneNumber: admin.phoneNumber
      })),
      total
    };
  }

  // In your AdminRepoImpl class
  async updateProfile(
    adminId: string,
    updates: {
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
    }
  ): Promise<IUpdateProfileUsecase> {
    const updatedAdmin = await AdminModel.findByIdAndUpdate(
      adminId,
      { $set: updates },
      { new: true }
    );

    if (!updatedAdmin) {
      throw new Error("Admin not found");
    }

    return {
      id: updatedAdmin._id.toString(),
      email: updatedAdmin.email,
      firstName: updatedAdmin.firstName,
      lastName: updatedAdmin.lastName,
      phoneNumber: updatedAdmin.phoneNumber,
    };
  }

  async findById(adminId: string): Promise<IFindAdminByIdResponse | null> {
    const admin = await AdminModel.findById(adminId);
    return admin ? {
      id: admin._id.toString(),
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      phoneNumber: admin.phoneNumber,
    } : null;
  }
}
