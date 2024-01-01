import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Result } from 'typescript-result';

import { IWasmRepo } from '@domain/wasm';

export class DownloadWasmQuery {
  constructor(readonly versionId: string) {}
}

@QueryHandler(DownloadWasmQuery)
export class DownloadWasmQueryHandler implements IQueryHandler<DownloadWasmQuery, Result<Error, Buffer>> {
  constructor(@Inject('IWasmRepo') private readonly repo: IWasmRepo) {}

  async execute(query: DownloadWasmQuery): Promise<Result<Error, Buffer>> {
    return Result.safe(async () => await this.repo.downloadWasm(query.versionId));
  }
}
