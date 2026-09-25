export interface IChangeStatusUsecaseDto{
  acknowledged?: boolean;
  matchedCount: number;
  modifiedCount?: number;
}
