import { INotification } from "./i-notification-interface";

export interface IGetUnreadChatNotificationsResponse {
  success: boolean;
  notifications?: INotification[];
  error?: string;
}