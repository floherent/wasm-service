import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Result } from 'typescript-result';

import { IWasmRepo } from '@domain/wasm';

export class DownloadHistoryQuery {
  constructor(readonly versionId: string) {}
}

@QueryHandler(DownloadHistoryQuery)
export class DownloadHistoryQueryHandler implements IQueryHandler<DownloadHistoryQuery, Result<Error, Buffer>> {
  constructor(@Inject('IWasmRepo') private readonly repo: IWasmRepo) {}

  async execute(query: DownloadHistoryQuery): Promise<Result<Error, Buffer>> {
    return Result.safe(async () => await this.repo.downloadHistory(query.versionId));
  }
}
