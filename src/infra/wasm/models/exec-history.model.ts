export class ExecHistoryModel {
  constructor(
    readonly inputs: string,
    readonly outputs: string,
    readonly executed_at: string,
    readonly execution_time: string,
  ) {}
}

export class ExecHistoryModelHandler extends ExecHistoryModel {
  get asDto(): ExecHistoryModel {
    return new ExecHistoryModel(this.inputs, this.outputs, this.executed_at, this.execution_time);
  }

  constructor(
    fields: {
      inputs: string;
      outputs: string;
      executed_at: string;
      execution_time: string;
    },
    public sep = '|',
  ) {
    super(fields.inputs, fields.outputs, fields.executed_at, fields.execution_time);
  }

  toCsv(sep?: string): string {
    return [this.inputs, this.outputs, this.executed_at, this.execution_time].join(sep ?? this.sep);
  }

  static headers(sep?: string): string {
    return ['inputs', 'outputs', 'executed_at', 'execution_time'].join(sep ?? '|');
  }
}
