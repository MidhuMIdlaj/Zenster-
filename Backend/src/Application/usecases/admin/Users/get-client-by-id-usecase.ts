import { inject, injectable } from "inversify";
import IUserRepository from "../../../../domain/Repository/i-user-repository";
import { TYPES } from "../../../../types";
import { IGetClientByIdUsecaseDto } from "../../../../domain/dtos/user-usecase/get-client-by-id-usecase-interface";
import { IGetClientByIdUseCase } from "../../../interface/admin/user/get-client-by-id-usecase-interface";


@injectable()
export class GetClientByIdUseCase  implements IGetClientByIdUseCase{
   constructor(
        @inject(TYPES.IUserRepository) private clientRepo : IUserRepository
     ){}

  async execute(id: string): Promise<IGetClientByIdUsecaseDto | null> {
    if (!id) {
      throw new Error("Client ID is required");
    }

    const client = await this.clientRepo.getClientById(id);
    return client;
  }
}
