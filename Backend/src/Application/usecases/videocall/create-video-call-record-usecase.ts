import { inject, injectable } from "inversify";
import { IVideoCallHistoryRepository } from "../../../domain/Repository/i-videocall-history-repository";
import { TYPES } from "../../../types";
import { ICreateVideoCallRecordUseCase } from "../../interface/videocall/create-videocall-record-usecase-interface";
import { IVideoCallHistory, VideoCallHistoryInput } from "../../../domain/dtos/videocall/video-call-history-usecase-interface";



@injectable()
export class CreateVideoCallRecordUseCase implements ICreateVideoCallRecordUseCase{
  constructor(
    @inject(TYPES.IVideoCallRepository) private videoCallHistoryRepo: IVideoCallHistoryRepository
  ) {
    this.videoCallHistoryRepo = videoCallHistoryRepo;
  }

  async execute(callRecord: IVideoCallHistoryRepository): Promise<IVideoCallHistoryRepository> {
    const videoCallInput = callRecord as unknown as VideoCallHistoryInput;

    if (!videoCallInput.roomId) {
      throw new Error("Room ID is required");
    }

    const createdRecord = await this.videoCallHistoryRepo.create(videoCallInput);
    return createdRecord as unknown as IVideoCallHistoryRepository;
  }
}
