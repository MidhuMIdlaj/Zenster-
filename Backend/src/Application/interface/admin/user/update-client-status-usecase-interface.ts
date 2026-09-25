import { ResponseDTO } from "../../../../domain/dtos/Response";
import { UpdateClientStatusDTO } from "../../../../domain/dtos/user-usecase/update-client-status-usecase-interface";


export default interface IUpdateClientStatusUseCase {
  execute(dto: UpdateClientStatusDTO): Promise<ResponseDTO<null>>;
}