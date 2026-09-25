import Client, { Product } from "../../entities/User";

export interface IEditClientUsecase{
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

export interface EditClientDTO {
  clientId: string;
  updateData: Partial<Client>;
}

