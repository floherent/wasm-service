import { JsonValue } from '@shared/utils';

export class ExecHistory {
  constructor(
    readonly inputs: JsonValue,
    readonly outputs: JsonValue,
    readonly executed_at: Date | number,
    readonly execution_time: string,
  ) {}
}
