export interface Location {
  employeeId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
  provider: string;
  timestamp: Date;
}