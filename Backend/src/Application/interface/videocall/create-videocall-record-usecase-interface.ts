import { IVideoCallHistoryRepository } from "../../../domain/Repository/i-videocall-history-repository";

export interface ICreateVideoCallRecordUseCase {
  execute(callRecord: IVideoCallHistoryRepository): Promise<IVideoCallHistoryRepository>;
}
