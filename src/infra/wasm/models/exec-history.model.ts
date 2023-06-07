export class ExecHistoryModel {
  private readonly _headers = [
    'version_id',
    'inputs',
    'outputs',
    'executed_at',
    'execution_time',
    'service_name',
    'revision',
  ];

  readonly version_id: string;
  readonly inputs: string;
  readonly outputs: string;
  readonly executed_at: number;
  readonly execution_time: string;
  readonly service_name?: string;
  readonly revision?: string;

  constructor(
    fields: {
      version_id: string;
      inputs: string;
      outputs: string;
      executed_at: number;
      execution_time: string;
      service_name?: string;
      revision?: string;
    },
    public sep = ',',
  ) {
    this.version_id = fields.version_id;
    this.inputs = fields.inputs;
    this.outputs = fields.outputs;
    this.executed_at = fields.executed_at;
    this.execution_time = fields.execution_time;
    this.service_name = fields.service_name;
    this.revision = fields.revision;
  }

  toCsv(sep?: string): string {
    return [
      this.version_id,
      this.inputs,
      this.outputs,
      this.executed_at,
      this.execution_time,
      this.service_name,
      this.revision,
    ].join(sep ?? this.sep);
  }

  headers(sep?: string): string {
    return this._headers.join(sep ?? this.sep);
  }
}
