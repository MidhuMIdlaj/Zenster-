import { inject, injectable } from "inversify";
import { IAdminRepository } from "../../../domain/Repository/i-admin-repository";
import { TYPES } from "../../../types";
import { IFindAdminByIdResponse } from "../../../domain/dtos/Admin-usecase/find-admin-by-id-usecase-interface";
import { IFindAdminByIdUseCase } from "../../interface/admin/admin/find-admin-by-id-usecase-interface";


@injectable()
export default class FindAdminByIdUseCase implements IFindAdminByIdUseCase {
   constructor(
     @inject(TYPES.IAdminRepository) private adminRepo : IAdminRepository
   ){}

  async execute(adminId: string): Promise<IFindAdminByIdResponse | null> {
    if (!adminId) {
      throw new Error("Admin ID is required");
    }

    const admin = await this.adminRepo.findById(adminId);
    return admin;
  }
}
