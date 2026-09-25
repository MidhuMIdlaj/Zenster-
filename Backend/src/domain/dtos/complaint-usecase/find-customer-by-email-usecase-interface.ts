import { CustomerResponseDTO } from "../user-usecase/customer-response-usecase-interface";

export interface IFindCustomerByEmailUsecaseDto {
  exists: boolean;
  data: CustomerResponseDTO | null;
}
