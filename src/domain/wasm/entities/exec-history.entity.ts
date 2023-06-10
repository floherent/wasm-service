import { JsonValue } from '@shared/utils';

export class ExecHistory {
  constructor(
    readonly version_id: string,
    readonly inputs: JsonValue,
    readonly outputs: JsonValue,
    readonly executed_at: Date | number,
    readonly execution_time: string,
  ) {}
}
