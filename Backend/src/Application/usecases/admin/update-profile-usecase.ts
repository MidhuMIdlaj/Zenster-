import { inject, injectable } from "inversify";
import { IAdminRepository } from "../../../domain/Repository/i-admin-repository";
import { TYPES } from "../../../types";
import { IUpdateProfileUsecase } from "../../../domain/dtos/Admin-usecase/update-admin-profile-usecase-interface";
import { IUpdateProfileUseCase } from "../../interface/admin/admin/update-profile-usecase-interface";

export interface UpdateProfileInput {
  adminId: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}


@injectable()
export default class UpdateProfileUseCase implements IUpdateProfileUseCase {
  constructor(
   @inject(TYPES.IAdminRepository) private adminRepo : IAdminRepository
  ){}

  
  async execute(adminId: string, data: UpdateProfileInput): Promise<IUpdateProfileUsecase> {
    const existingAdmin = await this.adminRepo.findById(adminId);
    if (!existingAdmin) {
      throw new Error("Admin not found");
    }

    const updatedAdmin = await this.adminRepo.updateProfile(adminId, {
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber,
    });

    return updatedAdmin;
  }
}

