import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result } from 'typescript-result';

import { IBatchRepo, Batch } from '@domain/wasm';
import { JsonValue } from '@shared/utils';

export class RunBatchCommand {
  constructor(readonly batch: Batch, readonly records: JsonValue[]) {}
}

@CommandHandler(RunBatchCommand)
export class RunBatchCommandHandler implements ICommandHandler<RunBatchCommand, Result<Error, Batch>> {
  constructor(@Inject('IBatchRepo') private readonly repo: IBatchRepo) {}

  async execute(cmd: RunBatchCommand): Promise<Result<Error, Batch>> {
    const { batch, records } = cmd;
    Logger.log(`starting batch <${batch.id}> of ${records.length} records`);

    return Result.safe(async () => await this.repo.executeAsync(batch, records));
  }
}
