import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Result } from 'typescript-result';

import { IWasmRepo, Batch } from '@domain/wasm';
import { ExecResponseData, JsonValue } from '@shared/utils';

export class RunBatchCommand {
  constructor(readonly batch: Batch, readonly records: JsonValue[]) {}
}

@CommandHandler(RunBatchCommand)
export class RunBatchCommandHandler implements ICommandHandler<RunBatchCommand, Result<Error, ExecResponseData[]>> {
  constructor(@Inject('IWasmRepo') private readonly repo: IWasmRepo, private readonly eventBus: EventBus) {}

  async execute(cmd: RunBatchCommand): Promise<Result<Error, ExecResponseData[]>> {
    const { batch, records } = cmd;
    Logger.log(`starting batch (${batch.id})`);

    return Result.safe(async () => {
      return await this.repo.executeBatch(batch, records);
    });
  }
}
