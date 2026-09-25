// src/infrastructure/db/models/VideoCallHistory.ts
import mongoose, { Schema } from 'mongoose';
import { IVideoCallHistory } from '../../../domain/dtos/videocall/video-call-history-usecase-interface';



const VideoCallHistorySchema: Schema = new Schema({
  roomId: { type: String, required: true, index: true },
  initiatorId: { type: String, required: true },
  initiatorName: { type: String, required: false },
  participants: [
    {
      employeeName: String,
      employeeId: { type: String, required: true },
      joinedAt: Date,
      leftAt: Date,
    }
  ],
  startedAt: { type: Date, default: Date.now },
  endedAt: Date,
  duration: Number,
  status: { 
    type: String, 
    enum: ['ongoing', 'ended'], 
    default: 'ongoing' 
  }
}, {
  timestamps: true
});

export default mongoose.model<IVideoCallHistory>('VideoCallHistory', VideoCallHistorySchema);
