import { ExecResult, JsonValue } from '@shared/utils';

export class BatchData {
  constructor(
    readonly version_id: string,
    readonly executed_at: string | undefined,
    readonly duration_in_ms: number,
    readonly outputs: JsonValue[],
    readonly execution_times: number[],
    readonly compiler_version?: string,
    readonly service_category?: string,
    readonly correlation_id?: string,
    readonly system?: string,
    readonly errors?: JsonValue[],
    readonly warnings?: JsonValue[],
  ) {}

  static empty(versionId?: string): BatchData {
    return new BatchData(versionId ?? '', null, 0, [], []);
  }

  static from(results: ExecResult[]): BatchData {
    if (results.length === 0) return BatchData.empty();

    const outputs: JsonValue[] = [];
    const errors: JsonValue[] = [];
    const warnings: JsonValue[] = [];
    const elapsed_times: number[] = [];
    let versionId: string,
      compiler_version: string,
      service_category: string,
      correlation_id: string,
      system: string,
      duration_in_ms = 0;

    for (const r of results) {
      elapsed_times.push(+r.elapsed.toFixed(3));
      outputs.push(r.output.response_data.outputs);
      errors.push(r.output.response_data.errors);
      warnings.push(r.output.response_data.warnings);
      duration_in_ms += r.elapsed;
      versionId = r.output.response_meta.version_id;
      compiler_version = r.output.response_meta.compiler_version;
      service_category = r.output.response_meta.service_category;
      correlation_id = r.output.response_meta.correlation_id;
      system = r.output.response_meta.system;
    }

    return new BatchData(
      versionId,
      new Date().toISOString(),
      +duration_in_ms.toFixed(3),
      outputs,
      elapsed_times,
      compiler_version,
      service_category,
      correlation_id,
      system,
      errors,
      warnings,
    );
  }
}
