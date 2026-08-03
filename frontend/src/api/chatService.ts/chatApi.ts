import axiosInstance from '../axiosInstance';
import { configManager } from '../../config/config';

const API_BASE_URL = configManager.getApiEndpoint('/chat');
 

export const ChatService = {
  // Get chat history between two users
  getChatHistory: async (userId: string, receiverId: string) => {
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/history/${userId}/${receiverId}`);
      const history = response.data?.data;
      if (!Array.isArray(history)) {
        console.warn('Unexpected chat history response shape:', response.data);
        return [];
      }
      return history;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      throw error;
    }
  },

  // Send a new message
sendMessage: async (messageData: any, files: File[] = []) => {
  try {
    const formData = new FormData();
    
    // Append fields directly
    formData.append('senderId', messageData.senderId);
    formData.append('receiverId', messageData.receiverId);
    formData.append('text', messageData.text || '');
    formData.append('conversationId', messageData.conversationId);
    formData.append('senderRole', messageData.senderRole);
    formData.append('receiverRole', messageData.receiverRole);
    
    // Append messageType if present
    formData.append('messageType', messageData.messageType || (files.length > 0 ? 'file' : 'text'));

    // Append files
    files.forEach((file) => {
      formData.append('attachments', file); // Match multer field name
    });


    const response = await axiosInstance.post(`${API_BASE_URL}/messages`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    const responseData = response.data;
    return responseData?.success && responseData.data ? responseData.data : responseData;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
},


  // Mark messages as read
  markMessagesAsRead: async (conversationId: string, userId: string) => {
    try {
      const response = await axiosInstance.put(`${API_BASE_URL}/messages/read`, {
        conversationId,
        userId,
      });
      return response.data;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  },

  // Get all conversations for a user
  getConversations: async (userId: string) => {
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/conversations/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  },
};