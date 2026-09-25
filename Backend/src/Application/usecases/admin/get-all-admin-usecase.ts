import { inject, injectable } from "inversify";
import { IAdminRepository } from "../../../domain/Repository/i-admin-repository";
import { TYPES } from "../../../types";
import { IGetAllAdminUsecase } from "../../../domain/dtos/Admin-usecase/get-all-admin-usecase-interface";
import { IGetAllAdminsUseCase } from "../../interface/admin/admin/get-all-admin-usecase-interface";


@injectable()
export default class GetAllAdminsUseCase implements IGetAllAdminsUseCase {
   constructor(
    @inject(TYPES.IAdminRepository) private adminRepo : IAdminRepository
   ){}

  async execute(
    page?: number,
    limit?: number
  ): Promise<{ admins: IGetAllAdminUsecase[]; total: number }> {
    const currentPage = page ?? 1;
    const perPage = limit ?? 10;

    const result = await this.adminRepo.getAllAdmins(currentPage, perPage);
    return result;
  }
}
