import { DateType } from "./complaint";

export interface SalesDataPoint {
    name: string;
    value: number;
  }
  
  export interface StockDataPoint {
    name: string;
    inStock: number;
    outStock: number;
  }
  
  export interface DispatchDataPoint {
    day: string;
    value: number;
  }
  
  export interface SegmentDataPoint {
    name: string;
    value: number;
  }
  
 
export interface Client {
  id : string
  email: string;
  clientName: string;
  attendedDate: string;
  contactNumber: string;
  address: string;
  productName: string;
  quantity: string;
  brand: string;
  model: string;
  warrantyDate: string;
  guaranteeDate: string;
  status : string;
  lastLogin: string;
}

export interface EmployeeFormData {
  employeeName: string;
  emailId: string;
  // token : string;
  // message : string;
  joinDate: string;
  contactNumber: string;
  address: string;
  currentSalary: string;
  age: string;
  position: 'coordinator' | 'mechanic'; 
  previousJob: string;
  experience: string;
  status : string;
}


export interface responseData {
  success: boolean;
  message: string;
  statusCode: number;
  data: {
    token: string;
    id: string;
    position: string;
    employeeName: string;
    emailId?: string;
  };
}

export interface ResetPasswordEmailFormData {
  message : string;
  email : string;
}

  
  export interface SummaryItem {
    title: string;
    value: string;
    subtitle: string;
  }
  
  export interface StatsCardData {
    title: string;
    value: string;
    change: string;
    period: string;
  }

  export interface Admin{
    accessToken : string;
    email : string;
    id: string;
    password : string; 
  }

  export interface EmployeeResponse extends EmployeeFormData {
  id: string;
  status: 'active' | 'inactive';
}

export interface FormData {
  id: string;
  email: string;
  ClientName: string;
  attendedDate: string;
  contactNumber: string;
  address: string;
  productName: string;
  quantity: string;
  brand: string;
  model: string;
  warrantyDate: string;
  guaranteeDate: string;
  status: string;
  lastLogin: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  place: string;
  district: string;
  status: "active" | "inactive";
  attendanceData: string;
  address: string;
  productName: string;
  quantity: string;
  brand: string;
  model: string;
  warrantyDate: string;
  guaranteeDate: string;
  lastLogin: string;
}

export interface Product {
  id: string;
  productName: string; 
  model: string;
  brand: string;     
  quantity: string;  
  warrantyDate: DateType;
  guaranteeDate: DateType;
  status: string;
}