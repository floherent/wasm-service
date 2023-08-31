import { BatchData, ExecData } from '@domain/wasm';

export type Nullable<T> = T | null | undefined;

export type BatchStatus = 'created' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'expired';

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | Array<JsonValue>
  | {
      [key: string]: JsonValue;
    };

export type ExecRequestData = {
  request_data: {
    inputs: JsonValue;
  };
  request_meta: {
    version_id: string;
    call_purpose: string;
    source_system?: string;
    correlation_id?: string;
    requested_output?: string;
    service_category?: string;
    compiler_type?: string;
  };
};

export type ExecResponseData = ExecData | BatchData;

export type ExecResult = { input: ExecRequestData; output: ExecData; elapsed: number };

export interface ExternalWasm {
  filename: string;
  url: string;
  path: string;
  size: number;
}
