import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Result } from 'typescript-result';

import { IBatchRepo, Batch, ExecuteBatchDto, BatchCreatedEvent } from '@domain/batch';
import { JsonValue, Spark } from '@shared/utils';

export class CreateBatchCommand {
  constructor(readonly versionId: string, readonly clientId: string, readonly dto: ExecuteBatchDto) {}
}

@CommandHandler(CreateBatchCommand)
export class CreateBatchCommandHandler implements ICommandHandler<CreateBatchCommand, Result<Error, Batch>> {
  constructor(@Inject('IBatchRepo') private readonly repo: IBatchRepo, private readonly eventBus: EventBus) {}

  async execute(cmd: CreateBatchCommand): Promise<Result<Error, Batch>> {
    const { versionId, clientId, dto } = cmd;
    const [format, inputs, shared] = Spark.inferFormatFrom(dto.inputs);
    const records = inputs as JsonValue[];
    const bufferSize = Buffer.from(JSON.stringify(records)).length;
    dto.format = format;

    return Result.safe(async () => {
      const result = await this.repo.create(versionId, clientId, bufferSize, records.length);
      if (result?.id) {
        this.eventBus.publish(new BatchCreatedEvent(result, records, shared));
      }
      return result;
    });
  }
}
