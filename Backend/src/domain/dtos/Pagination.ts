export interface PaginationDTO<T = unknown> {
  
  body: T[];

 
  total: number;


  page: number;


  last_page: number;
}