
import axiosInstance from '../axiosInstance';
import { configManager } from '../../config/config';

const API_BASE_URL = configManager.getApiBaseUrl();


export const VideoCallService = {
  sendInvitations: async (callLink: string, initiatorId: string , initiatorName : string) => {
    try {
      const response = await axiosInstance.post(`${API_BASE_URL}/video-call/send-invitations`, {
        callLink,
        initiatorId,
        initiatorName
      });
      return response.data;
    } catch (error: any) {
      console.error('Error sending video call invitations:', error);
      throw new Error(error.response?.data?.message || 'Failed to send invitations');
    }
  },

  createCallHistory: async (data: {
    roomId: string;
    callLink: string;
    initiatorId: string;
    participants: { employeeId: string; employeeName: string; position: string }[];
  }) => {
    try {
      const response = await axiosInstance.post(`${API_BASE_URL}/video-call-history/create`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating video call history:', error);
      throw new Error(error.response?.data?.message || 'Failed to create call history');
    }
  },

  updateParticipants: async (roomId: string, participants: { employeeId: string; employeeName: string; joinedAt?: string; leftAt?: string }[]) => {
  try {
    const response = await axiosInstance.put(`${API_BASE_URL}/video-call-history/update-participants/${roomId}`, {
      participants
    });
    return response.data;
  } catch (error: any) {
    console.error('Error updating participants:', error);
    throw new Error(error.response?.data?.message || 'Failed to update participants');
  }
},

  endCall: async (roomId: string) => {
    try {
      const response = await axiosInstance.put(`${API_BASE_URL}/video-call-history/end/${roomId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error ending video call:', error);
      throw new Error(error.response?.data?.message || 'Failed to end call');
    }
  },

  getCallHistory: async () => {
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/video-call-history/history`);
      return response.data;
    } catch (error: any) {
      console.error('Error retrieving video call history:', error);
      throw new Error(error.response?.data?.message || 'Failed to retrieve call history');
    }
  },

  getCallByRoomId: async (roomId: string) => {
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/video-call-history/history/${roomId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error retrieving video call by room ID:', error);
      throw new Error(error.response?.data?.message || 'Failed to retrieve call record');
    }
  },
};