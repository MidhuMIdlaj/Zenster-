import { VideoCallParticipant } from "../../../domain/dtos/videocall/video-call-history-usecase-interface";
import { IVideoCallHistoryRepository } from "../../../domain/Repository/i-videocall-history-repository";

export interface IUpdateCallParticipantsUseCase {
  execute(roomId: string, participants: VideoCallParticipant[]): Promise<IVideoCallHistoryRepository>;
}
