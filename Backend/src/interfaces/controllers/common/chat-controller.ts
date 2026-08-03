import { Request, Response, NextFunction } from 'express';
import { StatusCode } from '../../../shared/enums/statusCode';
import { sendError, sendSuccess } from '../../../shared/response';
import { io } from '../../../server';
import { IAttachment } from '../../../domain/Repository/i-chat-repository';
import { getSocketInstance } from '../../../app';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../../types';
import { ChatAttachmentUploader } from '../../../infrastructure/Services/s3-uploads-service';
import { IGetConversationsUseCase } from '../../../Application/interface/chat/get-conversation-usecase-interface';
import { IGetChatHistoryUseCase } from '../../../Application/interface/chat/get-history-usecase-interface';
import { IMarkMessagesAsReadUseCase } from '../../../Application/interface/chat/mark-message-as-read-usecase-interface';
import { ISaveMessageUseCase } from '../../../Application/interface/chat/save-message-usecase-interface';
import { NotificationRepository } from '../../../infrastructure/Services/notification-service';
import EmployeeModel from '../../../infrastructure/db/models/employee.model';
import { AdminModel } from '../../../infrastructure/db/models/Admin/admin.model';


@injectable()
export class ChatController {
  constructor(
    @inject(TYPES.getChatHistoryUseCase) private getChatHistoryUseCase : IGetChatHistoryUseCase,
    @inject(TYPES.getConversationsUsecase) private getConversationsUsecase : IGetConversationsUseCase,
    @inject(TYPES.saveMessageUseCase) private saveMessageUseCase : ISaveMessageUseCase,
    @inject(TYPES.MarkMessagesAsReadUseCase) private MarkMessagesAsReadUseCase : IMarkMessagesAsReadUseCase,
    @inject(TYPES.ChatAttachmentUploader) private ChatAttachmentUploader : ChatAttachmentUploader
  ){}


  getChatHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, receiverId } = req.params;
      const conversationId = [userId, receiverId].sort().join('_');
      const messages = await this.getChatHistoryUseCase.execute(userId, receiverId);
      sendSuccess(res, messages, 'Chat history retrieved successfully', StatusCode.OK);
    } catch (err) {
      console.error('Error fetching chat history:', err);
      next(err);
    }
  };

  getConversations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const conversations = await this.getConversationsUsecase.execute(userId);
      sendSuccess(res, conversations, 'Conversations retrieved successfully', StatusCode.OK);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      next(err);
    }
  };



 saveMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { senderId, receiverId, text, conversationId, senderRole, receiverRole, messageType } = req.body;
      const files = req.files as Express.Multer.File[] | undefined;

      if (!senderId || !receiverId || !conversationId || !senderRole || !receiverRole) {
        sendError(res, 'Missing required fields', StatusCode.BAD_REQUEST);
        return;
      }

      const attachments: IAttachment[] = [];
      if (files && files.length > 0) {
        for (const file of files) {
          const url = await this.ChatAttachmentUploader.upload(file);
          attachments.push({
            url,
            type: file.mimetype,
            name: file.originalname,
            size: file.size,
          });
        }
      }

      let finalMessageType = messageType || 'text';
      if (attachments.length > 0) {
        finalMessageType = 'file';
      } else if (!messageType && text) {
        if (/urgent|asap|immediately|important/i.test(text)) finalMessageType = 'urgent';
        if (/task|todo|action item/i.test(text)) finalMessageType = 'task';
      }

      const savedMessage = await this.saveMessageUseCase.execute({
        senderId,
        receiverId,
        text: text || '',
        conversationId,
        senderRole,
        receiverRole,
        messageType: finalMessageType,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      const io = getSocketInstance();
      io.to(`user_${receiverId}`).emit('new_message', savedMessage);

      // Fetch sender's name from database
      let senderName = 'Unknown';
      if (senderRole === 'admin') {
        const admin = await AdminModel.findById(senderId);
        senderName = admin ? `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || 'Admin' : 'Admin';
      } else {
        const employee = await EmployeeModel.findById(senderId);
        senderName = employee?.employeeName || 'Employee';
      }

      const notificationRepo = new NotificationRepository();
      await notificationRepo.createChatNotification(
        receiverId,
        senderId,
        senderName,
        text || (attachments.length > 0 ? 'File attachment' : ''),
        conversationId,
        receiverRole,
        senderRole
      );

      sendSuccess(res, savedMessage, 'Message sent successfully', StatusCode.CREATED);
    } catch (err) {
      console.error('Error saving message:', err);
      sendError(res, 'Failed to send message', StatusCode.BAD_REQUEST, (err as Error).message, undefined);
      next(err);
    }
  };


markMessagesAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { conversationId, userId } = req.body;
    
    if (!conversationId || !userId) {
      sendError(res, 'Missing required fields', StatusCode.BAD_REQUEST);
      return;
    }
    const markedCount = await this.MarkMessagesAsReadUseCase.execute({conversationId, userId});
    if (io) {
      io.to(`user_${userId}`).emit('messages_read', { conversationId });
    }
    sendSuccess(res, { markedCount }, 'Messages marked as read', StatusCode.OK);
  } catch (err) {
    console.error('Error marking messages as read:', err);
    next(err);
   }
 };
}
