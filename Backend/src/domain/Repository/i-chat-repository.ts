import { IGetConversationUsecase } from "../dtos/Chat-usecase/get-conversation-usecase";
import { IMarkMessagesAsReadUsecaseDto } from "../dtos/Chat-usecase/mark-message-as-read-usecase-interface";
import { ISavedMessageUsecase } from "../dtos/Chat-usecase/save-message-usecase-interface";

export interface IAttachment {
  url: string;
  type: string;
  name: string;
  size: number;
}

export interface IChatMessage {
  _id: string; 
  senderId: string;
  receiverId: string;
  text?: string;
  attachments?: IAttachment[];
  time: Date;
  isDelivered: boolean;
  isRead: boolean;
  messageType?: string;
  conversationId: string;
  senderRole: string;
  receiverRole: string;
}

export interface IChatRepository {
  getChatHistory(conversationId: string): Promise<IChatMessage[]>;
  getConversations(userId: string): Promise<IGetConversationUsecase[]>;
  saveMessage(messageData: {
    senderId: string;
    receiverId: string;
    text?: string;
    attachments?: IAttachment[];
    messageType?: string;
    conversationId?: string;
    senderRole?: string;
    receiverRole?: string;
  }): Promise<ISavedMessageUsecase>;
  markMessagesAsRead(conversationId: string, userId: string): Promise<IMarkMessagesAsReadUsecaseDto>;
}