export interface IGetAllCurrentLocationsUseCase {
  execute(): Promise<Record<string, unknown>[]>;
}