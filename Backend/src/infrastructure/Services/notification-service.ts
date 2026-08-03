// service/NotificationService.ts
import mongoose from 'mongoose';
import { ioInstance } from '../../app';
import NotificationModel from '../db/models/notification.model';
import { INotificationRepository } from '../../domain/Repository/i-notification-repository';
import { IComplaintRepoReturn } from '../../domain/dtos/complaint-usecase/create-complaint-usecase-interface';
import { IGetNotificationsForUserOutput } from '../../domain/dtos/notification-usecase/get-notification-for-user-usecase-interface';
import { ISendNewComplaintNotification } from '../../domain/dtos/notification-usecase/send-new-complaint-notification-interface';
import { INotification } from '../../domain/dtos/notification-usecase/i-notification-interface';

export class NotificationRepository implements INotificationRepository {
   async sendNewComplaintNotification(
    mechanicId: string,
    complaint: IComplaintRepoReturn,
    createdBy: string
   ): Promise<ISendNewComplaintNotification>{
    try {
      const deadline = this.calculateDeadline(complaint.priority);
      const message = `You got one complaint, finish the task before 2 hours`;
      const notification = new NotificationModel({
        recipientId: mechanicId,
        recipientType: 'mechanic',
        title: 'New Complaint Assigned',
        message,
        type: 'complaint_assigned',
        relatedId: complaint.id,
        createdBy,
        read: false,
        data: {
          complaintId: complaint.id,
          customerName: complaint.customerName,
          priority: complaint.priority,
          productName: complaint.productName,
          deadline,
        },
      });
      const savedNotification = await notification.save();
      if (ioInstance) {
        const roomName = `user_${mechanicId}`;
        const notificationData = {
          _id: savedNotification._id,
          title: savedNotification.title,
          message: savedNotification.message,
          createdAt: savedNotification.createdAt,
          read: savedNotification.read,
          complaintId: complaint.id,
          deadline: savedNotification.data.deadline,
          priority: complaint.priority,
        };

        ioInstance.to(roomName).emit('new_complaint_assigned', notificationData);
        const socketsInRoom = await ioInstance.in(roomName).fetchSockets();
        return {
          success: true,
          notificationId: savedNotification._id?.toString(),
          socketsReached: socketsInRoom.length,
        };
      } else {
        return {
          success: false,
          error: 'Socket instance not available',
          notificationId: savedNotification._id?.toString()
        };
      }
    } catch (error) {
      console.error('❌ Error sending notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }


 async createVideoCallNotification(
  recipientIds: string[],
  initiatorId: string,
  callLink: string,
  initiatorName: string,
  recipientType : string,
) {
  try {
    const notifications = await Promise.all(
      recipientIds.map(async (recipientId) => {
        const notification = new NotificationModel({
          recipientId,
          recipientType,
          title: 'New Video Call Invitation',
          message: `${initiatorName} has invited you to a video call`,
          type: 'video_call',
          relatedId: callLink, 
          createdBy: initiatorId,
          read: false,
          data: {
            callLink,
            initiatorName,
            timestamp: new Date()
          }
        });
        const savedNotification = await notification.save();
        
        if (ioInstance) {
          const sockets = await ioInstance.fetchSockets();
          sockets.forEach(s => {
            if (s.rooms.has(`user_${recipientId}`)) {
            }
            if (s.rooms.has(`role_${recipientType}`)) {
            }
          });
          try {
            ioInstance.to(`user_${recipientId}`).emit('new_video_call_notification', {
              _id: savedNotification._id,
              title: 'Video Call Invitation',
              message: `${initiatorName} is calling - Click to join`,
              callLink,
              initiatorName,
              timestamp: savedNotification.createdAt,
              recipientType
            });

            ioInstance.to(`role_${recipientType}`).emit('new_video_call_notification', {
              _id: savedNotification._id,
              title: 'Video Call Invitation',
              message: `${initiatorName} is calling - Click to join`,
              callLink,
              initiatorName,
              timestamp: savedNotification.createdAt,
              recipientType
            });
          } catch (emitError) {
            console.error('Error emitting notification:', emitError);
          }
        }

        return savedNotification;
      })
    );

    return notifications;
  } catch (error) {
    console.error('Error creating video call notifications:', error);
    throw error;
  }
}
  

   async getNotificationsForUser(userId: string): Promise<IGetNotificationsForUserOutput> {
    try {
      const notifications = await NotificationModel.find({ recipientId: userId })
        .sort({ createdAt: -1 })
        .limit(50) 
        .lean()
        .exec();

       const transformed = notifications.map(notif => ({
      ...notif,
      _id: notif._id.toString(), 
    })) as unknown as INotification[];
      return { success: true, notifications : transformed };
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

   async markChatNotificationAsRead(notificationId: string, conversationId: string) {
    try {
       if (!notificationId || !mongoose.Types.ObjectId.isValid(notificationId)) {
      return { success: false, error: 'Invalid notification ID' };
    }
    if (!conversationId) {
      return { success: false, error: 'Conversation ID is required' };
    }
      const notification = await NotificationModel.findOneAndUpdate(
        {
          _id: notificationId,
          type: 'chat_message',
          relatedId: conversationId
        },
        { read: true },
        { new: true }
      );

      if (!notification) {
        return { success: false, error: 'Chat notification not found' };
      }
      const result = await NotificationModel.updateMany(
        {
          type: 'chat_message',
          relatedId: conversationId,
          read: false,
          recipientId: notification.recipientId
        },
        { read: true }
      );

      if (ioInstance) {
      ioInstance.to(`user_${notification.recipientId}`).emit('chat_notifications_read', {
        conversationId,
        markedCount: result.modifiedCount
      });
    }

      return { 
        success: true, 
        notification,
        markedCount: result?.modifiedCount || 0
      };
    } catch (error) {
      console.error('❌ Error marking chat notification as read:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

   async markNotificationAsRead(notificationId: string) {
    try {
       if (!notificationId || !mongoose.Types.ObjectId.isValid(notificationId)) {
      return { success: false, error: 'Invalid notification ID' };
    }

      const updatedNotification = await NotificationModel.findByIdAndUpdate(
        notificationId,
        { read: true },
        { new: true }
      );

      if (!updatedNotification) {
        return { success: false, error: 'Notification not found' };
      }

      if (ioInstance) {
      ioInstance.to(`user_${updatedNotification.recipientId}`).emit('notification_read', {
        notificationId: updatedNotification._id,
        read: true
      });
    }
      return { success: true, updatedNotification };
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

   calculateDeadline(priority: string): Date {
    const now = new Date();
    const hours = priority === 'high' ? 2 : 4; 
    now.setHours(now.getHours() + hours);
    return now;
  }

  async createChatNotification(
    recipientId: string,
    senderId: string,
    senderName: string,
    messageText: string,
    conversationId: string,
    recipientRole: string,
    senderRole: string
  ) {
 
    try {
      const normalizedMessageText = messageText || '';
      const truncatedMessage = normalizedMessageText.length > 50 
        ? `${normalizedMessageText.substring(0, 50)}...` 
        : normalizedMessageText;

      const notification = new NotificationModel({
        recipientId,
        recipientType: recipientRole,
        title: `New message from ${senderName}`,
        message: truncatedMessage,
        type: 'chat_message',
        relatedId: conversationId,
        createdBy: senderId,
        read: false,
        data: {
          senderId,
          senderName,
          senderRole,
          conversationId,
          messagePreview: truncatedMessage
        }
      });

      const savedNotification = await notification.save();

      if (ioInstance) {
        const notificationData = {
          notificationId: savedNotification._id,
          title: savedNotification.title,
          message: savedNotification.message,
          type: savedNotification.type,
          createdAt: savedNotification.createdAt,
          read: savedNotification.read,
          
          senderId: savedNotification.createdBy,
          senderName,
          senderRole,
          conversationId
        };

        ioInstance.to(`user_${recipientId}`).emit('new_chat_notification', notificationData);
      }

      return savedNotification;
    } catch (error) {
      console.error('Error creating chat notification:', error);
      throw error;
    }
  }


   async getUnreadChatNotifications(userId: string, role: string) {
  try {
    const notifications = await NotificationModel.find({
      recipientId: userId,
      recipientType: role,
      type: 'chat_message',
      read: false
    }).sort({ createdAt: -1 });
    return { success: true, notifications };
  } catch (error) {
    console.error('Error fetching unread chat notifications:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

 async markAllChatNotificationsAsRead(userId: string) {
  try {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return { success: false, error: 'Invalid user ID' };
    }

    const result = await NotificationModel.updateMany(
      {
        recipientId: userId,
        read: false
      },
      { read: true }
    );

    if (ioInstance) {
      ioInstance.to(`user_${userId}`).emit('all_chat_notifications_read', {
        userId,
        markedCount: result.modifiedCount
      });
    }

    return { 
      success: true,
      markedCount: result.modifiedCount 
    };
  } catch (error) {
    console.error('Error marking all chat notifications as read:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

}
