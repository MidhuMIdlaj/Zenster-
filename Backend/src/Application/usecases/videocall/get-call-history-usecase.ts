import { inject, injectable } from "inversify";
import { IVideoCallHistoryRepository } from "../../../domain/Repository/i-videocall-history-repository";
import { TYPES } from "../../../types";
import { IGetCallHistoryUseCase } from "../../interface/videocall/get-call-history-usecase-interface";
import { IVideoCallHistory } from "../../../domain/dtos/videocall/video-call-history-usecase-interface";

@injectable()
export default class GetCallHistoryUseCase implements IGetCallHistoryUseCase {
  constructor(
    @inject(TYPES.IVideoCallRepository)  private videoCallHistoryRepo: IVideoCallHistoryRepository,
  ) {}

  async execute(): Promise<IVideoCallHistoryRepository[]> {
    const callHistory = await this.videoCallHistoryRepo.findAll();
    return callHistory as unknown as IVideoCallHistoryRepository[];
  }
}
