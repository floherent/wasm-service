export class BatchModel {
  constructor(
    readonly id: string,
    readonly status: string,
    readonly service_id: string,
    readonly executed_at: string,
    readonly total_inputs: string,
    readonly total_processed: string,
    readonly total_outputs: string,
    readonly duration_in_ms: string,
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
      executed_at: Date;
      total_inputs: number;
      total_processed: number;
      total_outputs: number;
      duration_in_ms: number | undefined;
    },
    public sep = ',',
  ) {
    super(
      fields.id,
      fields.status,
      fields.service_id,
      fields.executed_at?.toISOString(),
      fields.total_inputs?.toString(),
      fields.total_processed?.toString(),
      fields.total_outputs?.toString(),
      fields.duration_in_ms?.toString(),
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

  headers(sep?: string): string {
    return this._headers.join(sep ?? this.sep);
  }
}
