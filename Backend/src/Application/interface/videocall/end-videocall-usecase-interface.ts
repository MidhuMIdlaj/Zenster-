import { IVideoCallHistoryRepository } from "../../../domain/Repository/i-videocall-history-repository";

export interface IEndVideoCallUseCase {
  execute(roomId: string): Promise<IVideoCallHistoryRepository>;
}
