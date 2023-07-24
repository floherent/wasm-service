import { JsonValue } from '@shared/utils';

export class ExecData {
  constructor(
    readonly response_data: {
      outputs: JsonValue;
      errors?: JsonValue;
      warnings?: JsonValue;
      service_chain?: JsonValue;
    },
    readonly response_meta?: {
      version_id: string;
      correlation_id?: string;
      service_category?: string;
      system?: string;
      compiler_version?: string;
      process_time?: number;
    },
  ) {}
}
