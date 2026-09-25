import { IMarkMessagesAsReadUsecaseDto } from "../../../domain/dtos/Chat-usecase/mark-message-as-read-usecase-interface";

export interface IMarkMessagesAsReadUseCase {
  execute(params: { conversationId: string; userId: string }): Promise<IMarkMessagesAsReadUsecaseDto>;
}
