export interface IDeleteComplaintUsecaseDto {
  acknowledged: boolean;
  matchedCount: number;
  modifiedCount?: number; 
}
