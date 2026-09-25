import { EditClientDTO, IEditClientUsecase } from "../../../../domain/dtos/user-usecase/edit-client-usecase-interface";


export interface IEditClientUseCase {
  execute(dto: EditClientDTO): Promise<IEditClientUsecase | null>;
}
