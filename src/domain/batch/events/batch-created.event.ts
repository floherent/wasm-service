import { Logger } from '@nestjs/common';
import { IEvent, EventsHandler, IEventHandler, CommandBus } from '@nestjs/cqrs';
import { Result } from 'typescript-result';

import { JsonValue } from '@shared/utils';
import { SocketService } from '@app/modules/socket';
import { RunBatchCommand } from '../commands/run-batch.cmd';
import { Batch } from '../entities/batch.entity';

export class BatchCreatedEvent implements IEvent {
  constructor(
    readonly batch: Batch,
    readonly inputs: JsonValue[],
    readonly metadata?: Record<string, any>,
    readonly shared?: JsonValue,
  ) {}
}

@EventsHandler(BatchCreatedEvent)
export class BatchCreatedEventHandler implements IEventHandler<BatchCreatedEvent> {
  constructor(private readonly commandBus: CommandBus, private socketService: SocketService) {}

  async handle(event: BatchCreatedEvent) {
    try {
      const command = new RunBatchCommand(event.batch, event.inputs, event.metadata, event.shared);
      const result = await this.commandBus.execute<RunBatchCommand, Result<Error, Batch>>(command);
      const payload = result.getOrThrow();

      Logger.log(`batch <${payload.id}> ready`);
    } catch (error) {
      const payload = { ...event.batch, status: 'failed' };
      this.socketService.emit('batch:failed', payload);

      Logger.log(`batch <${payload.id}> failed`);
      console.error(error);
    }
  }
}
