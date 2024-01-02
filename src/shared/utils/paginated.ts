export class Paginated<T> {
  private constructor(public content: T[], public pagination: Pagination) {}

  static empty<P>(pagination: { page: number; limit: number; total: number }): Paginated<P> {
    return Paginated.from([], pagination);
  }

  static from<P>(data: P[], pagination: { page: number; limit: number; total: number }): Paginated<P> {
    return new Paginated<P>(data, {
      page: pagination.page,
      size: pagination.limit,
      total_items: pagination.total,
      total_pages: Math.ceil(pagination.total / pagination.limit),
      number_of_items: data.length,
    });
  }

  static toIndex(page: number, limit: number): [number, number] {
    const start = (page - 1) * limit;
    const end = start + limit;
    return [start, end];
  }
}

export interface Pagination {
  page: number;
  size: number;
  total_items: number;
  total_pages: number;
  number_of_items: number;
}
