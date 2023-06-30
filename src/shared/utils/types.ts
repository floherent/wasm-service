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

export interface ExecRequestData {
  request_data: {
    inputs: JsonValue;
  };
  request_meta: {
    version_id: string;
    call_purpose: string;
    source_system: string;
    correlation_id: string;
    requested_output: Nullable<string>;
    service_category: string;
    compiler_type: Nullable<string>;
  };
}

export interface ExecResponseData {
  response_data: {
    outputs: JsonValue;
    errors?: JsonValue;
    warnings?: JsonValue;
    service_chain?: JsonValue;
  };
  response_meta: {
    version_id: string;
    correlation_id?: string;
    service_category?: string;
    system?: string;
    compiler_version?: string;
    process_time?: number;
  };
}
