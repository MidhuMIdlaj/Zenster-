import { INotification } from "./i-notification-interface";


export interface IMarkChatNotificationAsReadResult {
  success: boolean;
  error?: string;
  notification?: INotification;
  markedCount?: number;
}