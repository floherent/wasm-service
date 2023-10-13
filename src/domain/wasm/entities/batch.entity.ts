import { BatchStatus } from '@shared/utils';
import { v4 as uuid } from 'uuid';

export class Batch {
  constructor(
    readonly id: string,
    readonly status: BatchStatus,
    readonly service_id: string,
    readonly client_id: string | undefined,
    readonly executed_at: Date,
    readonly total_inputs = 0,
    readonly total_processed = 0,
    readonly total_outputs = 0,
    readonly duration_in_ms: number | undefined = undefined,
  ) {}

  static created(serviceId: string, clientId: string, totalInputs: number): Batch {
    return new Batch(uuid(), 'created', serviceId, clientId, new Date(), totalInputs);
  }

  static updated(batch: Batch, status: BatchStatus = 'processing', processed = 0, outputs = 0, duration = 0): Batch {
    return new Batch(
      batch.id,
      status,
      batch.service_id,
      batch.client_id,
      batch.executed_at,
      batch.total_inputs,
      processed,
      outputs,
      duration,
    );
  }

  static completed(batch: Batch, totalProcessed: number, totalOutputs: number, durationInMs: number): Batch {
    return Batch.updated(batch, 'completed', totalProcessed, totalOutputs, durationInMs);
  }
}
