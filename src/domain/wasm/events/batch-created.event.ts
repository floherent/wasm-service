import { Logger } from '@nestjs/common';
import { IEvent, EventsHandler, IEventHandler, CommandBus } from '@nestjs/cqrs';

import { JsonValue } from '@shared/utils';
import { Batch } from '../entities/batch.entity';
import { RunBatchCommand } from '../commands/run-batch.cmd';

export class BatchCreatedEvent implements IEvent {
  constructor(readonly batch: Batch, readonly inputs: JsonValue[]) {}
}

@EventsHandler(BatchCreatedEvent)
export class BatchCreatedEventHandler implements IEventHandler<BatchCreatedEvent> {
  constructor(private readonly commandBus: CommandBus) {}

  async handle(event: BatchCreatedEvent) {
    Logger.log(`new batch (${event.batch.id}) submitted`);
    const command = new RunBatchCommand(event.batch, event.inputs);
    const result = await this.commandBus.execute(command);
    const payload = result.getOrThrow();
    console.log(JSON.stringify(payload, null, 2));
    // TODO: notify client via socket
  }
}
