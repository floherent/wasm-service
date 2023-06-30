import { IEvent, EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { JsonValue } from '@shared/utils';
import { Batch } from '../entities/batch.entity';
import { Logger } from '@nestjs/common';

export class BatchSubmittedEvent implements IEvent {
  constructor(readonly batch: Batch, readonly inputs: JsonValue) {}
}

@EventsHandler(BatchSubmittedEvent)
export class BatchSubmittedEventHandler implements IEventHandler<BatchSubmittedEvent> {
  async handle(event: BatchSubmittedEvent) {
    Logger.log(`new batch (${event.batch.id}) submitted`);
  }
}
