export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResult extends PaginationParams {
  total: number
  totalPages: number
}

export const calcOffset = ({ page, limit }: PaginationParams) => (page - 1) * limit
