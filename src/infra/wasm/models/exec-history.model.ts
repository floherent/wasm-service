export class ExecHistoryModel {
  constructor(
    readonly version_id: string,
    readonly inputs: string,
    readonly outputs: string,
    readonly executed_at: number,
    readonly execution_time: string,
  ) {}
}

export class ExecHistoryModelHandler extends ExecHistoryModel {
  private readonly _headers = ['version_id', 'inputs', 'outputs', 'executed_at', 'execution_time'];

  get asDto(): ExecHistoryModel {
    return new ExecHistoryModel(this.version_id, this.inputs, this.outputs, this.executed_at, this.execution_time);
  }

  constructor(
    fields: {
      version_id: string;
      inputs: string;
      outputs: string;
      executed_at: number;
      execution_time: string;
    },
    public sep = '|',
  ) {
    super(fields.version_id, fields.inputs, fields.outputs, fields.executed_at, fields.execution_time);
  }

  toCsv(sep?: string): string {
    return [this.version_id, this.inputs, this.outputs, this.executed_at, this.execution_time].join(sep ?? this.sep);
  }

  headers(sep?: string): string {
    return this._headers.join(sep ?? this.sep);
  }
}
