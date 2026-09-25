import { GetClientsDTO, GetClientsResponse } from "../../../../domain/dtos/user-usecase/get-client-usecase-interface";

export interface IGetClientsUseCase {
  execute(dto: GetClientsDTO): Promise<GetClientsResponse>;
}
