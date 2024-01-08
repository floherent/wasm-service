import { JsonValue } from '@shared/utils';

export class ExecData {
  constructor(
    readonly response_data: {
      outputs: JsonValue;
      errors?: JsonValue;
      warnings?: JsonValue;
      service_chain?: JsonValue;
    },
    readonly response_meta?: { [key: string]: any },
  ) {}
}
