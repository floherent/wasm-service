import { BatchExec } from '@domain/batch';

export class BatchExecModel {
  constructor(
    readonly inputs: string,
    readonly outputs: string,
    readonly executed_at: string,
    readonly duration: string,
  ) {}
}

export class BatchExecModelHandler extends BatchExecModel {
  get asDto(): BatchExec {
    return new BatchExec(this.inputs, this.outputs, new Date(Number(this.executed_at)), +this.duration);
  }

  constructor(
    fields: {
      inputs: string;
      outputs: string;
      executed_at: string;
      duration: string;
    },
    public sep = '|',
  ) {
    super(fields.inputs, fields.outputs, fields.executed_at, fields.duration);
  }

  toCsv(sep?: string): string {
    return [this.inputs, this.outputs, this.executed_at, this.duration].join(sep ?? this.sep);
  }

  static headers(sep = '|'): string {
    return ['inputs', 'outputs', 'executed_at', 'duration'].join(sep);
  }
}
