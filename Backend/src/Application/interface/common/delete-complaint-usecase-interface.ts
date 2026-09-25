import { IDeleteComplaintUsecaseDto } from "../../../domain/dtos/complaint-usecase/complaint-delete-usecase-interface";

export default interface IDeleteComplaintUseCase {
  execute(id: string): Promise<IDeleteComplaintUsecaseDto>;
}
