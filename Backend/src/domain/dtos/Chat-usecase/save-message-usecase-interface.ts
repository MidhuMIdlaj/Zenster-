import { IAttachment } from "../../Repository/i-chat-repository";

export interface ISavedMessageUsecase {
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
export interface SaveMessageInput {
  senderId: string;
  receiverId: string;
  text?: string;
  conversationId: string;
  senderRole: string;
  receiverRole: string;
  messageType?: string;
  files?: Express.Multer.File[];
  attachments?: IAttachment[];  
}