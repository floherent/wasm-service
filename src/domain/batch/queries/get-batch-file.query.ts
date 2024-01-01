import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Result } from 'typescript-result';

import { IBatchRepo } from '@domain/batch';

export class GetBatchFileQuery {
  constructor(readonly batchId: string) {}
}

@QueryHandler(GetBatchFileQuery)
export class GetBatchFileQueryHandler implements IQueryHandler<GetBatchFileQuery, Result<Error, Buffer>> {
  constructor(@Inject('IBatchRepo') private readonly repo: IBatchRepo) {}

  async execute(query: GetBatchFileQuery): Promise<Result<Error, Buffer>> {
    return Result.safe(async () => await this.repo.downloadResult(query.batchId));
  }
}
