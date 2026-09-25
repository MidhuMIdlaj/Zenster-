import { inject, injectable } from "inversify";
import IUserRepository from "../../../../domain/Repository/i-user-repository";
import { TYPES } from "../../../../types";
import { IGetClientsUseCase } from "../../../interface/admin/user/get-client-usecase-interface";
import { GetClientsDTO, GetClientsResponse } from "../../../../domain/dtos/user-usecase/get-client-usecase-interface";


@injectable()
export class GetClientsUseCase  implements IGetClientsUseCase {
   constructor(
      @inject(TYPES.IUserRepository) private clientRepo : IUserRepository
     ){}

  async execute(dto: GetClientsDTO): Promise<GetClientsResponse> {
    const { page, limit } = dto;
    const { clients, total } = await this.clientRepo.getAllClients(page, limit);
    return {
      clients,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    };
  }
}
