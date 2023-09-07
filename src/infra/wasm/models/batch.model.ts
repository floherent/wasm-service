import { Batch } from '@domain/wasm';
import { BatchStatus } from '@shared/utils';

export class BatchModel {
  constructor(
    readonly id: string,
    readonly status: string,
    readonly service_id: string,
    readonly executed_at: string,
    readonly total_inputs: string,
    readonly total_processed: string,
    readonly total_outputs: string,
    readonly duration_in_ms: string | undefined,
  ) {}
}

export class BatchModelHandler extends BatchModel {
  private readonly _headers = [
    'id',
    'status',
    'service_id',
    'executed_at',
    'total_inputs',
    'total_processed',
    'total_outputs',
    'duration_in_ms',
  ];

  get asDto(): BatchModel {
    return new BatchModel(
      this.id,
      this.status,
      this.service_id,
      this.executed_at,
      this.total_inputs,
      this.total_processed,
      this.total_outputs,
      this.duration_in_ms,
    );
  }

  constructor(
    fields: {
      id: string;
      status: string;
      service_id: string;
      executed_at: string;
      total_inputs: string;
      total_processed: string;
      total_outputs: string;
      duration_in_ms: string | undefined;
    },
    public sep = ',',
  ) {
    super(
      fields.id,
      fields.status,
      fields.service_id,
      fields.executed_at,
      fields.total_inputs,
      fields.total_processed,
      fields.total_outputs,
      fields.duration_in_ms,
    );
  }

  toCsv(sep?: string): string {
    return [
      this.id,
      this.status,
      this.service_id,
      this.executed_at,
      this.total_inputs,
      this.total_processed,
      this.total_outputs,
      this.duration_in_ms,
    ].join(sep ?? this.sep);
  }

  toBatch(): Batch {
    return new Batch(
      this.id,
      this.status as BatchStatus,
      this.service_id,
      undefined,
      new Date(this.executed_at),
      +this.total_inputs,
      +this.total_processed,
      +this.total_outputs,
      +this.duration_in_ms,
    );
  }

  headers(sep?: string): string {
    return this._headers.join(sep ?? this.sep);
  }
}
