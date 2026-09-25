import { Product } from "../../entities/User";

export interface CustomerResponseDTO {
  id: string;
  name: string;
  email: string;
  address: string;
  status: string;
  productName: string | null;
  model: string | null;
  warrantyDate: Date | null;
  guaranteeDate: Date | null;
  products: Product[];
}