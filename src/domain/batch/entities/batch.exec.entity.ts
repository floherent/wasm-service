import { JsonValue } from '@shared/utils';

export class BatchExec {
  constructor(readonly inputs: JsonValue, readonly outputs: JsonValue, readonly process_time: string) {}
}
