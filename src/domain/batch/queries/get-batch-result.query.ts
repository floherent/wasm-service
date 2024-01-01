import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Result } from 'typescript-result';

import { IBatchRepo, BatchExec } from '@domain/batch';

export class GetBatchResultQuery {
  constructor(readonly batchId: string) {}
}

@QueryHandler(GetBatchResultQuery)
export class GetBatchResultQueryHandler implements IQueryHandler<GetBatchResultQuery, Result<Error, BatchExec[]>> {
  constructor(@Inject('IBatchRepo') private readonly repo: IBatchRepo) {}

  async execute(query: GetBatchResultQuery): Promise<Result<Error, BatchExec[]>> {
    return Result.safe(async () => await this.repo.getResult(query.batchId));
  }
}
