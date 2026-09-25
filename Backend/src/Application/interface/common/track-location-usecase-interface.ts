import { TrackLocationDTO } from "../../../domain/dtos/Location/track-location-usecase-interface";
import { Location } from "../../../domain/entities/Location";

export interface ITrackLocationUseCase {

  execute(
    data: TrackLocationDTO
  ): Promise<Location>;
}