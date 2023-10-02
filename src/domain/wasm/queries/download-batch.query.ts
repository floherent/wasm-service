import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Result } from 'typescript-result';

import { IBatchRepo } from '@domain/wasm';

export class DownloadBatchQuery {
  constructor(readonly batchId: string) {}
}

@QueryHandler(DownloadBatchQuery)
export class DownloadBatchQueryHandler implements IQueryHandler<DownloadBatchQuery, Result<Error, Buffer>> {
  constructor(@Inject('IBatchRepo') private readonly repo: IBatchRepo) {}

  async execute(query: DownloadBatchQuery): Promise<Result<Error, Buffer>> {
    return Result.safe(async () => await this.repo.download(query.batchId));
  }
}
