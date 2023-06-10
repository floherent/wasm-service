import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Result } from 'typescript-result';

import { ExecHistory, IWasmRepo } from '@domain/wasm';
import { PaginationQueryParams, Paginated } from '@shared/utils';

export class GetHistoryQuery {
  constructor(readonly versionId: string, readonly params: PaginationQueryParams) {}
}

@QueryHandler(GetHistoryQuery)
export class GetHistoryQueryHandler implements IQueryHandler<GetHistoryQuery, Result<Error, Paginated<ExecHistory>>> {
  constructor(@Inject('IWasmRepo') private readonly repo: IWasmRepo) {}

  async execute(query: GetHistoryQuery): Promise<Result<Error, Paginated<ExecHistory>>> {
    const { versionId, params } = query;
    return Result.safe(async () => await this.repo.getHistory(versionId, params));
  }
}
