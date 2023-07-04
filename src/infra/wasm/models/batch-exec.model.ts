export class BatchExecModel {
  constructor(readonly inputs: string, readonly outputs: string, readonly process_time: string) {}
}

export class BatchExecModelHandler extends BatchExecModel {
  private readonly _headers = ['inputs', 'outputs', 'process_time'];

  get asDto(): BatchExecModel {
    return new BatchExecModel(this.inputs, this.outputs, this.process_time);
  }

  constructor(
    fields: {
      inputs: string;
      outputs: string;
      process_time: string;
    },
    public sep = '|',
  ) {
    super(fields.inputs, fields.outputs, fields.process_time);
  }

  toCsv(sep?: string): string {
    return [this.inputs, this.outputs, this.process_time].join(sep ?? this.sep);
  }

  static headers(sep = '|'): string {
    return ['inputs', 'outputs', 'process_time'].join(sep);
  }
}
