import { Product } from "../../entities/User";

export interface IGetClientByIdUsecaseDto {
  id: string;
  email: string;
  clientName: string;
  attendedDate: Date;
  contactNumber: string;
  address: string;
  products: Product[];
  status: string;
  isDeleted: boolean;
}
