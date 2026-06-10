import { PAGINATION } from '../constants';
import { PaginatedResult, PaginationParams } from '../types';

export function parsePaginationParams(query: Record<string, any>): Required<PaginationParams> {
  const page = Math.max(1, parseInt(query.page as string, 10) || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(1, parseInt(query.limit as string, 10) || PAGINATION.DEFAULT_LIMIT)
  );
  const sortBy = (query.sortBy as string) || 'createdAt';
  const sortOrder = (query.sortOrder as 'asc' | 'desc') === 'asc' ? 'asc' : 'desc';

  return { page, limit, sortBy, sortOrder };
}

export function paginateResult<T>(
  data: T[],
  total: number,
  params: Required<PaginationParams>
): PaginatedResult<T> {
  const { page, limit } = params;
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
  };
}

export function getPrismaPagination(params: Required<PaginationParams>) {
  const { page, limit, sortBy, sortOrder } = params;
  return {
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
  };
}
