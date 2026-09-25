import { SearchParams, SearchResult } from "../../../../domain/dtos/Employee-usecase/search-employee-usecase-interface";

export default interface ISearchEmployeesUseCase {
  execute(params: SearchParams): Promise<SearchResult>;
}