import { ISavedMessageUsecase, SaveMessageInput } from "../../../domain/dtos/Chat-usecase/save-message-usecase-interface";

export interface ISaveMessageUseCase {
  execute(input: SaveMessageInput): Promise<ISavedMessageUsecase>;
}