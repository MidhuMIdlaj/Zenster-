import { inject, injectable } from "inversify";
import { IChatRepository } from "../../../domain/Repository/i-chat-repository";
import { TYPES } from "../../../types";
import { IMarkMessagesAsReadUsecaseDto } from "../../../domain/dtos/Chat-usecase/mark-message-as-read-usecase-interface";
import { IMarkMessagesAsReadUseCase } from "../../interface/chat/mark-message-as-read-usecase-interface";

interface MarkMessagesAsReadParams {
  conversationId: string;
  userId: string;
}


@injectable()
export default class MarkMessagesAsReadUseCase implements IMarkMessagesAsReadUseCase {
    constructor(
      @inject(TYPES.IChatRepository) private  chatRepo : IChatRepository
   ) {}

  async execute({ conversationId, userId }: MarkMessagesAsReadParams): Promise<IMarkMessagesAsReadUsecaseDto> {
    if (!conversationId || !userId) {
      throw new Error("Missing required parameters: conversationId or userId");
    }

    const markedCount = await this.chatRepo.markMessagesAsRead(conversationId, userId);
    return markedCount;
  }
}
