import { IVideoCallHistoryRepository } from "../../../domain/Repository/i-videocall-history-repository";

export interface IGetCallHistoryUseCase {
  execute(): Promise<IVideoCallHistoryRepository[]>;
}
