export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResult extends PaginationParams {
  count: number
  totalPages: number
}
