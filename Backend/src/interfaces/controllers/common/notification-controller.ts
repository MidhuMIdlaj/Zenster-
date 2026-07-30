// src/controllers/NotificationController.ts
import { Request, Response, NextFunction } from 'express';
import { INotificationRepository } from '../../../domain/Repository/i-notification-repository';
import mongoose from 'mongoose';
import { StatusCode } from '../../../shared/enums/statusCode';
import { sendError, sendResponse, sendSuccess } from '../../../shared/response';
import { MarkChatNotificationAsReadUseCase } from '../../../Application/usecases/notification/mark-chat-notification-read-usecase';
import GetUnreadChatNotificationsUseCase from '../../../Application/usecases/notification/get-unread-chat-notification-usecase';
import { GetNotificationsForUserUseCase } from '../../../Application/usecases/notification/get-notification-for-user-usecase';
import { MarkNotificationAsReadUseCase } from '../../../Application/usecases/notification/mark-notification-as-read-usecase';
import { markAllChatNotificationsAsRead } from '../../../Application/usecases/notification/mark-all-chat-notification-as-read-usecase';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../../types';
import { IGetNotificationsForUserUseCase } from '../../../Application/interface/notification/get-notification-for-user-usecase-interface';
import { IGetUnreadChatNotificationsUseCase } from '../../../Application/interface/notification/get-unread-chat-notification-usecase-interface';
import { IMarkAllChatNotificationsAsReadUseCase } from '../../../Application/interface/notification/mark-all-chat-notification-as-read-usecase-interface';
import { IMarkChatNotificationAsReadUseCase } from '../../../Application/interface/notification/mark-chat-notification-read-usecase-interface';
import { IMarkNotificationAsReadUseCase } from '../../../Application/interface/notification/mark-notification-as-read-usecase-interface';


@injectable()
export class NotificationController {
  constructor(
    @inject(TYPES.GetNotificationsForUserUseCase) private GetNotificationsForUserUseCase : IGetNotificationsForUserUseCase,
    @inject(TYPES.MarkNotificationAsReadUseCase) private markNotificationAsReadUseCase : IMarkNotificationAsReadUseCase,
    @inject(TYPES.MarkChatNotificationAsReadUseCase) private markChatNotificationAsReadUseCase : IMarkChatNotificationAsReadUseCase,
    @inject(TYPES.GetUnreadChatNotificationsUseCase) private getUnreadChatNotificationsUseCase : IGetUnreadChatNotificationsUseCase,
    @inject(TYPES.MarkAllChatNotificationsAsReadUseCase) private markAllChatNotificationsAsReadUseCase : IMarkAllChatNotificationsAsReadUseCase
  ) {}


  getNotificationsForUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const result = await this.GetNotificationsForUserUseCase.execute({userId});
      const statusCode = (result as { statusCode?: number; success?: boolean }).statusCode ?? (result.success ? StatusCode.OK : StatusCode.INTERNAL_SERVER_ERROR);
      sendResponse(res, { ...result, statusCode });
    } catch (error) {
      next(error);
    }
  };

  markNotificationAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { notificationId } = req.params;
      const result = await this.markNotificationAsReadUseCase.execute({notificationId});
      
      if (result.success) {
        const statusCode = (result as { statusCode?: number }).statusCode ?? StatusCode.OK;
        sendResponse(res, { ...result, statusCode });
      } else {
        sendResponse(res, { ...result, statusCode: result.error === 'Notification not found' ? StatusCode.NOT_FOUND : StatusCode.BAD_REQUEST });
      }
    } catch (error) {
      next(error);
    }
  };

  markChatNotificationAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { notificationId, conversationId } = req.params;
      
      if (!conversationId) {
        sendError(res, 'Conversation ID is required', StatusCode.BAD_REQUEST);
        return;
      }

      const result = await this.markChatNotificationAsReadUseCase.execute({notificationId, conversationId});
      
      if (result.success) {
        const statusCode = (result as { statusCode?: number }).statusCode ?? StatusCode.OK;
        sendResponse(res, { ...result, statusCode });
      } else {
        sendResponse(res, { ...result, statusCode: result.error === 'Notification not found' ? StatusCode.NOT_FOUND : StatusCode.BAD_REQUEST });
      }
    } catch (error) {
      next(error);
    }
  };

  getUnreadChatNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const { role } = req.query as { role: string };

      if (!role || typeof role !== 'string') {
        sendError(res, 'Role parameter is required and must be a string', StatusCode.BAD_REQUEST);
        return;
      }

      const result = await this.getUnreadChatNotificationsUseCase.execute(userId, role);
      
      if (result.success) {
        sendSuccess(res, { notifications: result.notifications, count: result.notifications?.length }, 'Unread chat notifications retrieved successfully', StatusCode.OK);
      } else {
        sendError(res, result.error || 'Failed to fetch unread chat notifications', StatusCode.INTERNAL_SERVER_ERROR);
      }
    } catch (error) {
      next(error);
    }
  };

  markAllChatNotificationsAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.body;
      
      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        sendError(res, 'Invalid user ID', StatusCode.BAD_REQUEST);
        return;
      }

      const result = await this.markAllChatNotificationsAsReadUseCase.execute(userId);
      if (result.success) {
        sendSuccess(res, { markedCount: result.markedCount }, 'All chat notifications marked as read', StatusCode.OK);
      } else {
        sendResponse(res, { ...result, statusCode: StatusCode.INTERNAL_SERVER_ERROR });
      }
    } catch (error) {
      next(error);
    }
  };
}