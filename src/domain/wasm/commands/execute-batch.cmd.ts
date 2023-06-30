import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Result } from 'typescript-result';

import { ExecuteWasmDto, IWasmRepo, Batch, BatchSubmittedEvent } from '@domain/wasm';

export class ExecuteBatchCommand {
  constructor(readonly versionId: string, readonly dto: ExecuteWasmDto[]) {}
}

@CommandHandler(ExecuteBatchCommand)
export class ExecuteBatchCommandHandler implements ICommandHandler<ExecuteBatchCommand, Result<Error, Batch>> {
  constructor(@Inject('IWasmRepo') private readonly repo: IWasmRepo, private readonly eventBus: EventBus) {}

  async execute(cmd: ExecuteBatchCommand): Promise<Result<Error, Batch>> {
    const { versionId, dto } = cmd;
    return Result.safe(async () => {
      const result = await this.repo.executeBatch(versionId, dto);
      if (result?.id) {
        const event = new BatchSubmittedEvent(
          result,
          dto.map((d) => d.inputs),
        );
        this.eventBus.publish(event);
      }
      return result;
    });
  }
}
