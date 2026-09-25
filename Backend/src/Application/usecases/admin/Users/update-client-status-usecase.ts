import { inject, injectable } from "inversify";
import IUserRepository from "../../../../domain/Repository/i-user-repository";
import { TYPES } from "../../../../types";
import { ResponseDTO } from "../../../../domain/dtos/Response";
import IUpdateClientStatusUseCase from "../../../interface/admin/user/update-client-status-usecase-interface";
import { UpdateClientStatusDTO } from "../../../../domain/dtos/user-usecase/update-client-status-usecase-interface";




@injectable()
export class UpdateClientStatusUseCase implements IUpdateClientStatusUseCase {
  constructor(
    @inject(TYPES.IUserRepository) private clientRepo : IUserRepository
   ){}

  async execute(dto: UpdateClientStatusDTO): Promise<ResponseDTO<null>> {
    const { clientId, status } = dto;

    if (!clientId) {
      throw new Error("Client ID is required");
    }

    const success = await this.clientRepo.updateClientStatus(clientId, status.toString());
     if (!success) {
      return {
        success: false,
        message: "Client not found or status unchanged",
        statusCode: 404,
      };
    }
    return {
      success: true,
      message: "Client status updated successfully",
      statusCode: 200,
    };
  }
}
