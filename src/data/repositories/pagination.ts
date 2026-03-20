export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResult extends PaginationParams {
  total: number
  totalPages: number
}

export const calcOffset = ({ page, limit }: PaginationParams) => (page - 1) * limit

export const buildPagination = (
  pagination: PaginationParams,
  countResult: { value: number }[],
): PaginatedResult => {
  const { page, limit } = pagination
  const total = countResult[0]?.value ?? 0

  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  }
}
