import { IComplaintRepoReturn } from '../dtos/complaint-usecase/create-complaint-usecase-interface';
import { IGetNotificationsForUserOutput } from '../dtos/notification-usecase/get-notification-for-user-usecase-interface';
import { ISendNewComplaintNotification } from '../dtos/notification-usecase/send-new-complaint-notification-interface';
import { INotification } from '../../infrastructure/db/models/notification.model';
import { IMarkChatNotificationAsReadResult } from '../dtos/notification-usecase/mark-notification-as-read-interface';

// export interface INotification extends Document {
//   userId: string;
//   type: string;
//   content: string;
//   isRead: boolean;
//   createdAt: Date;
//   conversationId?: string;
//   recipientId: string;
//   __v?: number;  
// }


export interface INotificationRepository {
  sendNewComplaintNotification(
    mechanicId: string,
    complaint: IComplaintRepoReturn,
    createdBy: string
  ): Promise<ISendNewComplaintNotification>;

  createVideoCallNotification(
    recipientIds: string[],
    initiatorId: string,
    callLink: string,
    initiatorName: string,
    recipientType: string
  ): Promise<INotification[]>;

  getNotificationsForUser(userId: string): Promise<IGetNotificationsForUserOutput>;

  markNotificationAsRead(notificationId: string): Promise<{
    success: boolean;
    updatedNotification?: INotification | null;
    error?: string;
  }>;

  markChatNotificationAsRead(
    notificationId: string,
    conversationId: string
  ): Promise<IMarkChatNotificationAsReadResult>;

  createChatNotification(
    recipientId: string,
    senderId: string,
    senderName: string,
    messageText: string,
    conversationId: string,
    recipientRole: string,
    senderRole: string
  ): Promise<INotification>;

  getUnreadChatNotifications(userId: string, role: string): Promise<{ success: boolean; notifications?: INotification[]; error?: string }>;

  markAllChatNotificationsAsRead(userId: string): Promise<{
    success: boolean;
    markedCount?: number;
    error?: string;
  }>;
}
