import { Job } from "agenda";

export interface IComplaintReassignmentScheduler {

  start(): Promise<void>;

  scheduleReassignment(
    complaintId: string,
    excludeMechanicId: string,
    delay?: string
  ): Promise<Job>;

  scheduleUnavailableMechanicCheck(
    complaintId: string,
    delay?: string
  ): Promise<Job>;

  gracefulShutdown(): Promise<void>;

  listJobs(): Promise<Job[]>;
}