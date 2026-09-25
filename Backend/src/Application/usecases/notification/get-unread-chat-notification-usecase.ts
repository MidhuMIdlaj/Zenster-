import { inject, injectable } from "inversify";
import {  INotificationRepository } from "../../../domain/Repository/i-notification-repository";
import { TYPES } from "../../../types";
import { IGetUnreadChatNotificationsResponse } from "../../../domain/dtos/notification-usecase/get-unread-chat-notification-interface";
import { IGetUnreadChatNotificationsUseCase } from "../../interface/notification/get-unread-chat-notification-usecase-interface";


@injectable()
export default class GetUnreadChatNotificationsUseCase implements IGetUnreadChatNotificationsUseCase {
  constructor(
    @inject(TYPES.INotificationRepository)  private notificationRepo: INotificationRepository
  ) {}

  async execute(userId: string, role: string): Promise<IGetUnreadChatNotificationsResponse> {
    if (!userId || !role) {
      return {
        success: false,
        error: 'User ID and role are required'
      };
    }

    const repositoryResponse = await this.notificationRepo.getUnreadChatNotifications(userId, role);

    return repositoryResponse as unknown as IGetUnreadChatNotificationsResponse;
  }
}
