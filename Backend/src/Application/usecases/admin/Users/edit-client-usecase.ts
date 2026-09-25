import { inject, injectable } from "inversify";
import IUserRepository from "../../../../domain/Repository/i-user-repository";
import { TYPES } from "../../../../types";
import { EditClientDTO, IEditClientUsecase } from "../../../../domain/dtos/user-usecase/edit-client-usecase-interface";
import { IEditClientUseCase } from "../../../interface/admin/user/edit-client-usecase-interface";



@injectable()
export class EditClientUseCase implements IEditClientUseCase {
   constructor(
      @inject(TYPES.IUserRepository) private clientRepo : IUserRepository
   ){}
  async execute(dto: EditClientDTO): Promise<IEditClientUsecase | null> {
    const { clientId, updateData } = dto;
    if (!clientId) {
      throw new Error("Client ID is required");
    }
    const updatedClient = await this.clientRepo.updateClient(clientId, updateData);
    return updatedClient;
  }
}
