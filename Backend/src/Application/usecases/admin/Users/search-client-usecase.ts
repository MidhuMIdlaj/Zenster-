import { inject, injectable } from "inversify";
import IUserRepository from "../../../../domain/Repository/i-user-repository";
import { TYPES } from "../../../../types";
import { ISafeUserUsecase } from "../../../../domain/dtos/user-usecase/globel-user-interface";
import ISearchClientsUseCase from "../../../interface/admin/user/search-client-usecase-interface";


export interface SearchResult {
  clients: ISafeUserUsecase[];
  total: number;
  totalPages: number;
  currentPage: number;
}

@injectable()
export class SearchClientsUseCase implements ISearchClientsUseCase {
  constructor(
      @inject(TYPES.IUserRepository) private clientRepo : IUserRepository
    ){}

  async execute(
    searchTerm: string,
    status: string,
    page: number,
    limit: number
  ): Promise<SearchResult> {
    const { clients, total } = await this.clientRepo.searchClients(
      searchTerm,
      status,
      page,
      limit
    );

    return {
      clients,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  }
}
