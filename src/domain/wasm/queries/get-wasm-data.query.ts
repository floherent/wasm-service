import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Result } from 'typescript-result';

import { IWasmRepo } from '@domain/wasm';
import { WasmModel } from '@infra/wasm';
import { PaginationQueryParams, Paginated } from '@shared/utils';

export class GetWasmDataQuery {
  constructor(readonly params: PaginationQueryParams) {}
}

@QueryHandler(GetWasmDataQuery)
export class GetWasmDataQueryHandler implements IQueryHandler<GetWasmDataQuery, Result<Error, Paginated<WasmModel>>> {
  constructor(@Inject('IWasmRepo') private readonly repo: IWasmRepo) {}

  async execute(query: GetWasmDataQuery): Promise<Result<Error, Paginated<WasmModel>>> {
    return Result.safe(async () => await this.repo.getWasmData(query.params));
  }
}
