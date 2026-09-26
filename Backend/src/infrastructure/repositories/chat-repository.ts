import { IGetConversationUsecase } from '../../domain/dtos/Chat-usecase/get-conversation-usecase';
import { IMarkMessagesAsReadUsecaseDto } from '../../domain/dtos/Chat-usecase/mark-message-as-read-usecase-interface';
import { ISavedMessageUsecase } from '../../domain/dtos/Chat-usecase/save-message-usecase-interface';
import { IChatRepository, IChatMessage, IAttachment } from '../../domain/Repository/i-chat-repository';
import ClientModel from '../db/models/Admin/client.model';
import ChatMessage from '../db/models/chat.model';

export class ChatRepositoryImplement implements IChatRepository {
  async getChatHistory(conversationId: string): Promise<IChatMessage[]> {
    const messages = await ChatMessage.find({ conversationId })
      .sort({ time: 1 })
      .lean();

    return messages.map((msg) => ({
      _id: msg._id,
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      text: msg.text,
      attachments: msg.attachments,
      time: msg.time,
      isDelivered: msg.isDelivered,
      isRead: msg.isRead,
      messageType: msg.messageType ?? 'text',
      conversationId: msg.conversationId,
      senderRole: msg.senderRole,
      receiverRole: msg.receiverRole,
    })) as IChatMessage[];
  }

  async getCustomerEmails(): Promise<{ email: string; name: string }[]> {
    const customers = await ClientModel.find({ role: "customer" }, { email: 1, clientName: 1, _id: 0 }).lean();
    return customers.map((c) => ({ email: c.email, name: c.clientName }));
  }

  async getConversations(userId: string): Promise<IGetConversationUsecase[]> {
    return ChatMessage.aggregate([
      {
        $match: {
          $or: [{ senderId: userId }, { receiverId: userId }],
        },
      },
      {
        $sort: { time: -1 },
      },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$text' },
          time: { $first: '$time' },
          senderId: { $first: '$senderId' },
          receiverId: { $first: '$receiverId' },
          unreadCount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$receiverId', userId] }, { $eq: ['$isRead', false] }] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          conversationId: '$_id',
          lastMessage: 1,
          time: 1,
          otherUserId: {
            $cond: [{ $eq: ['$senderId', userId] }, '$receiverId', '$senderId'],
          },
          unreadCount: 1,
        },
      },
    ]);
  }

  async saveMessage(messageData: {
    senderId: string;
    receiverId: string;
    text?: string;
    attachments?: IAttachment[];
    messageType?: string;
    conversationId?: string;
    senderRole?: string;
    receiverRole?: string;
  }): Promise<ISavedMessageUsecase> {
    const newMessage = new ChatMessage({
      ...messageData,
      time: new Date(),
      isDelivered: true,
      isRead: false,
      messageType: messageData.messageType || (messageData.attachments?.length ? 'file' : 'text'),
      conversationId: messageData.conversationId || [messageData.senderId, messageData.receiverId].sort().join('_'),
    });

    const savedMessage = await newMessage.save();
    const plainMessage = savedMessage.toObject();
    return {
      _id: String(plainMessage._id),
      senderId: plainMessage.senderId,
      receiverId: plainMessage.receiverId,
      text: plainMessage.text,
      attachments: plainMessage.attachments,
      time: plainMessage.time,
      isDelivered: plainMessage.isDelivered,
      isRead: plainMessage.isRead,
      conversationId: plainMessage.conversationId,
      messageType: plainMessage.messageType || 'text',
      senderRole: plainMessage.senderRole,
      receiverRole: plainMessage.receiverRole,
    };
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<IMarkMessagesAsReadUsecaseDto> {
    const result = await ChatMessage.updateMany(
      {
        conversationId,
        receiverId: userId,
        isRead: false,
      },
      {
        $set: { isRead: true },
      }
    );
    return { markedCount: result.modifiedCount };
  }
}