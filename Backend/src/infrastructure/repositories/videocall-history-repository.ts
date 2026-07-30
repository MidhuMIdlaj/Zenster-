import { IVideoCallHistoryRepository } from '../../domain/Repository/i-videocall-history-repository';
import VideoCallHistoryModel, { IVideoCallHistory, VideoCallHistoryInput, VideoCallParticipant } from '../db/models/videocall.history.model';

export class VideoCallHistoryRepoImpl implements IVideoCallHistoryRepository {

  async create(callRecord: VideoCallHistoryInput): Promise<IVideoCallHistory> {
    try {
      const existingRecord = await VideoCallHistoryModel.findOne({ roomId: callRecord.roomId });
      if (existingRecord) {
        throw new Error('A call with this room ID already exists');
      }

      const newRecord = new VideoCallHistoryModel(callRecord);
      const savedRecord = await newRecord.save();
      return savedRecord;
    } catch (error: unknown) {
      console.error('Error creating video call history:', error);

      const e = error as Record<string, unknown>;
      if (e && e['name'] === 'MongoServerError' && (e['code'] as number) === 11000) {
        if ((e['keyPattern'] as Record<string, unknown>)?.roomId) {
          throw new Error('A call with this room ID already exists');
        }
      }
      throw error;
    }
  }

  async updateParticipants(roomId: string, participants: VideoCallParticipant[]): Promise<IVideoCallHistory> {
    const updated = await VideoCallHistoryModel.findOneAndUpdate(
      { roomId },
      { $set: { participants } },
      { new: true }
    );

    if (!updated) {
      throw new Error('Call record not found');
    }

    return updated;
  }

  async update(roomId: string, callRecord: IVideoCallHistory): Promise<IVideoCallHistory> {
    try {
      const updatedRecord = await VideoCallHistoryModel.findOneAndUpdate(
        { roomId },
        { ...callRecord, _id: callRecord.id },
        { new: true }
      );
      if (!updatedRecord) {
        console.error(`[VideoCallHistoryRepoImpl] Call record not found for roomId: ${roomId}`);
        throw new Error('Call record not found');
      }
      return updatedRecord;
    } catch (error: unknown) {
      const e = error as Error;
      console.error('[VideoCallHistoryRepoImpl] Update error:', {
        message: e?.message,
        stack: e?.stack,
        roomId,
      });
      throw error;
    }
  }

  async endCall(roomId: string): Promise<IVideoCallHistory> {
    const call = await VideoCallHistoryModel.findOne({ roomId });
    if (!call) throw new Error('Call not found');
    if (call.status === 'ended') return call;

    const endedAt = new Date();
    const startedAt = call.startedAt || new Date();

    call.endedAt = endedAt;
    call.status = 'ended';
    call.duration = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);

    return await call.save();
  }

  async findByRoomId(roomId: string): Promise<IVideoCallHistory | null> {
    try {
      const record = await VideoCallHistoryModel.findOne({ roomId });
      return record;
    } catch (error: unknown) {
      const e = error as Error;
      console.error('[VideoCallHistoryRepoImpl] FindByRoomId error:', {
        message: e?.message,
        stack: e?.stack,
        roomId,
      });
      throw error;
    }
  }

  async findAll(): Promise<IVideoCallHistory[]> {
    try {
      const records = await VideoCallHistoryModel.find().sort({ createdAt: -1 });
      return records;
    } catch (error: unknown) {
      const e = error as Error;
      console.error('[VideoCallHistoryRepoImpl] FindAll error:', {
        message: e?.message,
        stack: e?.stack,
      });
      throw error;
    }
  }
}