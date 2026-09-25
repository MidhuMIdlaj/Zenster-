import { ISafeUserUsecase } from "./globel-user-interface";

export interface GetClientsDTO {
  page: number;
  limit: number;
}


export interface GetClientsResponse {
  clients: ISafeUserUsecase[];
  total: number;
  totalPages: number;
  currentPage: number;
}
