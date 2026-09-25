import { inject, injectable } from "inversify";
import IEmployeeRepository from "../../../../domain/Repository/i-employee-repository";
import { TYPES } from "../../../../types";
import ISearchEmployeesUseCase from "../../../interface/admin/employee/search-employee-usecase-interface";
import { SearchParams, SearchResult } from "../../../../domain/dtos/Employee-usecase/search-employee-usecase-interface";



@injectable()
export class SearchEmployeesUseCase  implements ISearchEmployeesUseCase {
   constructor(
      @inject(TYPES.IEmployeeRepository) private employeeRepo : IEmployeeRepository
    ){}

  async execute(params: SearchParams): Promise<SearchResult> {
    const { searchTerm, status, position, page, limit } = params;

    return await this.employeeRepo.searchEmployees(
      searchTerm,
      status,
      position,
      page,  
      limit
    );
  }
}
