export interface IGetEmployeeProfileUsecaseDto{
  id: string;
  employeeName: string;
  emailId: string;
  joinDate: string | Date;
  contactNumber: string;
  address: string | null | undefined;
  currentSalary: number;
  age: number;
  position: "mechanic" | "coordinator";
  previousJob ?: string | null;
  experience ?: number |  null;
  status: string;
  isDeleted: Boolean;
  workingStatus: string;
  fieldOfMechanic: string[];
}