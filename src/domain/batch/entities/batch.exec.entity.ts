import { JsonValue } from '@shared/utils';

export class BatchExec {
  constructor(
    readonly inputs: JsonValue,
    readonly outputs: JsonValue,
    readonly executed_at: Date | number,
    readonly duration: number,
  ) {}
}
