import { inject, injectable } from "inversify";
import { ValidationError } from "../../../domain/error/employeeErrors";
import { IVideoCallHistoryRepository } from "../../../domain/Repository/i-videocall-history-repository";
import { TYPES } from "../../../types";
import { IUpdateCallParticipantsUseCase } from "../../interface/videocall/update-call-participens-usecase-inerface";
import {VideoCallParticipant} from "../../../domain/dtos/videocall/video-call-history-usecase-interface";


@injectable()
export default class UpdateCallParticipantsUseCase implements IUpdateCallParticipantsUseCase {
  constructor(
    @inject(TYPES.IVideoCallRepository)  private videoCallHistoryRepo: IVideoCallHistoryRepository,
  ) {}

  async execute(
    roomId: string,
    participants: VideoCallParticipant[],
  ): Promise<IVideoCallHistoryRepository> {
    if (!roomId || !Array.isArray(participants)) {
      throw new ValidationError("roomId and participants array are required");
    }

    const updatedCall = await this.videoCallHistoryRepo.updateParticipants(roomId, participants);

    if (!updatedCall) {
      throw new ValidationError("Call record not found");
    }
    return updatedCall as unknown as IVideoCallHistoryRepository;
  }
}
