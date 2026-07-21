export default class Employee {
    constructor(
      public id  :string,
      public joinDate: string | Date,
      public employeeName: string,
      public emailId: string,
      public contactNumber: string,
      public address: string | null | undefined,
      public currentSalary: number,
      public age: number,
      public password: string,
      public position: 'coordinator' | 'mechanic',
      public status : 'active' | 'inactive',
      public isDeleted : Boolean,
      public workingStatus: 'Available'| 'Occupied',
      public previousJob?: string | null,
      public experience?:  number | null,
      public fieldOfMechanic: string[] = [],
      public lastAssignedAt?: Date | null
    ) {}
  }