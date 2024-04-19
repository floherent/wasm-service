import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Result } from 'typescript-result';

import { IWasmRepo, WasmValidations } from '@domain/wasm';

export class GetValidationsQuery {
  constructor(readonly versionId: string) {}
}

@QueryHandler(GetValidationsQuery)
export class GetValidationsQueryHandler implements IQueryHandler<GetValidationsQuery, Result<Error, WasmValidations>> {
  constructor(@Inject('IWasmRepo') private readonly repo: IWasmRepo) {}

  async execute(query: GetValidationsQuery): Promise<Result<Error, WasmValidations>> {
    return Result.safe(async () => await this.repo.getValidations(query.versionId));
  }
}
