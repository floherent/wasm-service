export class PaginatedResponse<T> {
  constructor(public content: T[], public pagination: Pagination) {}

  static from<P>(data: P[], pagination: QueryPagination & { total: number }): PaginatedResponse<P> {
    return new PaginatedResponse<P>(data, {
      page: pagination.page,
      size: pagination.limit,
      total_items: pagination.total,
      total_pages: Math.ceil(pagination.total / pagination.limit),
      number_of_items: data.length,
    });
  }

  static toMongoParams(page: number, limit: number) {
    return {
      page: !page || page < 1 ? 1 : page,
      skip: limit * (page <= 0 ? 1 : page) - limit,
    };
  }
}

export interface Pagination {
  page: number;
  size: number;
  total_items: number;
  total_pages: number;
  number_of_items: number;
}

export interface QueryPagination {
  page: number;
  limit: number;
}
