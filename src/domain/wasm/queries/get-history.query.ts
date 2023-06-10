import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Result } from 'typescript-result';

import { IWasmRepo } from '@domain/wasm';
import { PaginationQueryParams, Paginated } from '@shared/utils';
import { ExecHistoryModel } from '@infra/wasm';

export class GetHistoryQuery {
  constructor(readonly versionId: string, readonly params: PaginationQueryParams) {}
}

@QueryHandler(GetHistoryQuery)
export class GetHistoryQueryHandler
  implements IQueryHandler<GetHistoryQuery, Result<Error, Paginated<ExecHistoryModel>>>
{
  constructor(@Inject('IWasmRepo') private readonly repo: IWasmRepo) {}

  async execute(query: GetHistoryQuery): Promise<Result<Error, Paginated<ExecHistoryModel>>> {
    const { versionId, params } = query;
    return Result.safe(async () => await this.repo.getHistory(versionId, params));
  }
}
