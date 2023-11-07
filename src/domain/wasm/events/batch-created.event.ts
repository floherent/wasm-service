import { Logger } from '@nestjs/common';
import { IEvent, EventsHandler, IEventHandler, CommandBus } from '@nestjs/cqrs';
import { Result } from 'typescript-result';

import { JsonValue } from '@shared/utils';
import { SocketService } from '@app/modules/socket';
import { RunBatchCommand } from '../commands/run-batch.cmd';
import { Batch } from '../entities/batch.entity';

export class BatchCreatedEvent implements IEvent {
  constructor(readonly batch: Batch, readonly inputs: JsonValue[]) {}
}

@EventsHandler(BatchCreatedEvent)
export class BatchCreatedEventHandler implements IEventHandler<BatchCreatedEvent> {
  constructor(private readonly commandBus: CommandBus, private socketService: SocketService) {}

  async handle(event: BatchCreatedEvent) {
    this.socketService.emit('batch:processing', event.batch);

    try {
      const command = new RunBatchCommand(event.batch, event.inputs);
      const result = await this.commandBus.execute<RunBatchCommand, Result<Error, Batch>>(command);
      const payload = result.getOrThrow();

      Logger.log(`batch <${event.batch.id}> ready`);
      this.socketService.emit('batch:completed', payload);
    } catch (error) {
      const payload = { ...event.batch, status: 'failed' };
      Logger.log(`batch <${payload.id}> failed`);
      this.socketService.emit('batch:failed', payload);
      console.error(error);
    }
  }
}
