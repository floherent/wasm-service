import { BatchStatus } from '@shared/utils';
import { v4 as uuid } from 'uuid';

export class Batch {
  constructor(
    readonly id: string,
    readonly status: BatchStatus,
    readonly service_id: string,
    readonly executed_at: Date,
    readonly total_inputs = 0,
    readonly total_processed = 0,
    readonly total_outputs = 0,
    public duration_in_ms: number | undefined = undefined,
  ) {}

  static created(serviceId: string, totalInputs: number): Batch {
    return new Batch(uuid(), 'created', serviceId, new Date(), totalInputs);
  }
}
