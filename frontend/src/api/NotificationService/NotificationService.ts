import axiosInstance from '../axiosInstance';
import { configManager } from '../../config/config';

const API_BASE_URL = configManager.getApiEndpoint('/notification');


export const NotificationService = {
  getNotificationsForUser: async (userId: string) => {
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/notifications/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  markNotificationAsRead: async (notificationId: string) => {
    try {
      const response = await axiosInstance.post(
        `${API_BASE_URL}/notifications/${notificationId}/mark-read`
      );
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  markChatNotificationAsRead: async (notificationId: string, conversationId: string) => {
    try {
      const response = await axiosInstance.post(
        `${API_BASE_URL}/notifications/chat/${notificationId}/mark-read/${conversationId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error marking chat notification as read:', error);
      throw error;
    }
  },

  createChatNotification: async (
    recipientId: string,
    senderId: string,
    senderName: string,
    messageText: string,
    conversationId: string,
    recipientRole: string = 'coordinator'
  ) => {
    try {
      const response = await axiosInstance.post(
        `${API_BASE_URL}/notifications/chat`,
        {
          recipientId,
          senderId,
          senderName,
          messageText,
          conversationId,
          recipientRole
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating chat notification:', error);
      throw error;
    }
  },

  getUnreadChatNotifications: async (userId: string, role: string) => {
    try {
      const response = await axiosInstance.get(
        `${API_BASE_URL}/notifications/unread-chat/${userId}`,
        { 
          params: { role },
          validateStatus: (status: number) => status < 500
        }
      );
      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.error?.message || 'Failed to fetch unread chat notifications');
      }
    } catch (error) {
      console.error('Error fetching unread chat notifications:', error);
      throw error;
    }
  }
};

export const getUnreadChatCount = async (userId: string, role: string) => {
  try {
    const response = await axiosInstance.get(
      `${API_BASE_URL}/notifications/unread-chat/${userId}`,
      { params: { role } }
    );
    return response.data.count || 0;
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return 0;
  }
};

export const markAllChatNotificationsRead = async (userId: string) => {
  try {
    const response = await axiosInstance.post(
      `${API_BASE_URL}/notifications/mark-all-chat-read`,
      { userId }
    );
    return response.data.success;
  } catch (error) {
    console.error("Error marking notifications read:", error);
    return false;
  }
};