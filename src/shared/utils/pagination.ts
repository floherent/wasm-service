import { DEFAULT_LIMIT_PAGE, DEFAULT_SKIP_PAGE } from '@shared/constants';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export interface PaginationQueryParams {
  page: number;
  limit: number;
  order: SortOrder;
}

export const PaginationParams = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();

  const page = parseNumber(request?.query?.page, DEFAULT_SKIP_PAGE);
  const limit = parseNumber(request?.query?.limit, DEFAULT_LIMIT_PAGE);
  const order = request?.query?.order?.toLowerCase() ?? SortOrder.ASC;

  return { page, limit, order };
});

const parseNumber = (value: unknown, defaultValue: number): number => {
  try {
    return Math.abs(Number(value));
  } catch (_) {
    return defaultValue;
  }
};
