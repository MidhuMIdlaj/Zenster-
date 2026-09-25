
export interface VideoCallHistoryInput {
  roomId: string;
  initiatorId: string;
  initiatorName?: string;
  participants: VideoCallParticipant[];
  startedAt?: Date;
  endedAt?: Date;
  status?: 'ongoing' | 'ended';
  duration?: number;
}
export interface VideoCallParticipant {
  employeeId: string;
  employeeName?: string;
  joinedAt?: Date;
  leftAt?: Date;
}

export interface IVideoCallHistory extends Document, VideoCallHistoryInput {
  createdAt: Date;
  updatedAt: Date;
}