import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Result } from 'typescript-result';

import { Batch, IBatchRepo } from '@domain/wasm';

export class GetBatchQuery {
  constructor(readonly versionId: string, readonly batchId: string) {}
}

@QueryHandler(GetBatchQuery)
export class GetBatchQueryHandler implements IQueryHandler<GetBatchQuery, Result<Error, Batch>> {
  constructor(@Inject('IBatchRepo') private readonly repo: IBatchRepo) {}

  async execute(query: GetBatchQuery): Promise<Result<Error, Batch>> {
    const { versionId, batchId } = query;
    return Result.safe(async () => await this.repo.findOne(versionId, batchId));
  }
}
