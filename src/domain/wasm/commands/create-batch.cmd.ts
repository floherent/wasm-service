import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Result } from 'typescript-result';

import { ExecuteWasmDto, IWasmRepo, Batch, BatchCreatedEvent } from '@domain/wasm';

export class CreateBatchCommand {
  constructor(readonly versionId: string, readonly clientId: string, readonly dto: ExecuteWasmDto[]) {}
}

@CommandHandler(CreateBatchCommand)
export class CreateBatchCommandHandler implements ICommandHandler<CreateBatchCommand, Result<Error, Batch>> {
  constructor(@Inject('IWasmRepo') private readonly repo: IWasmRepo, private readonly eventBus: EventBus) {}

  async execute(cmd: CreateBatchCommand): Promise<Result<Error, Batch>> {
    const { versionId, clientId, dto } = cmd;
    return Result.safe(async () => {
      const result = await this.repo.createBatch(versionId, clientId, dto);
      if (result?.id) {
        const event = new BatchCreatedEvent(
          result,
          dto.map((d) => d.inputs),
        );
        this.eventBus.publish(event);
      }
      return result;
    });
  }
}
