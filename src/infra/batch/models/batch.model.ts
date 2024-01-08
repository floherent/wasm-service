import { Batch } from '@domain/batch';
import { BatchStatus } from '@shared/utils';

export class BatchModel {
  constructor(
    readonly id: string,
    readonly status: string,
    readonly service_id: string,
    readonly executed_at: string,
    readonly buffer_size: string,
    readonly total_inputs: string,
    readonly total_processed: string,
    readonly total_outputs: string,
    readonly duration: string | undefined,
  ) {}
}

export class BatchModelHandler extends BatchModel {
  get asDto(): BatchModel {
    return new BatchModel(
      this.id,
      this.status,
      this.service_id,
      this.executed_at,
      this.buffer_size,
      this.total_inputs,
      this.total_processed,
      this.total_outputs,
      this.duration,
    );
  }

  constructor(
    fields: {
      id: string;
      status: string;
      service_id: string;
      executed_at: string;
      buffer_size: string;
      total_inputs: string;
      total_processed: string;
      total_outputs: string;
      duration: string | undefined;
    },
    public sep = ',',
  ) {
    super(
      fields.id,
      fields.status,
      fields.service_id,
      fields.executed_at,
      fields.buffer_size,
      fields.total_inputs,
      fields.total_processed,
      fields.total_outputs,
      fields.duration,
    );
  }

  toCsv(sep?: string): string {
    return [
      this.id,
      this.status,
      this.service_id,
      this.executed_at,
      this.buffer_size,
      this.total_inputs,
      this.total_processed,
      this.total_outputs,
      this.duration,
    ].join(sep ?? this.sep);
  }

  toBatch(): Batch {
    return new Batch(
      this.id,
      this.status as BatchStatus,
      this.service_id,
      undefined,
      new Date(this.executed_at),
      +this.buffer_size,
      +this.total_inputs,
      +this.total_processed,
      +this.total_outputs,
      +this.duration,
    );
  }

  static headers(sep = ','): string {
    return [
      'id',
      'status',
      'service_id',
      'executed_at',
      'buffer_size',
      'total_inputs',
      'total_processed',
      'total_outputs',
      'duration',
    ].join(sep);
  }
}
