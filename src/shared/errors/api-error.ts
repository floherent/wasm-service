export class ApiError extends Error {
  constructor(readonly code: string, readonly message: string) {
    super(message);
  }
}

export class WasmRecordNotSaved extends ApiError {
  constructor(readonly message = 'failed to save wasm file records') {
    super('WASM_RECORD_NOT_SAVED', message);
  }
}

export class WasmRecordNotFound extends ApiError {
  constructor(message = 'execution history file not found', id?: string) {
    message ??= `no execution history file defined for version_id: ${id}`;
    super('WASM_RECORD_NOT_FOUND', message);
  }
}

export class WasmNotFound extends ApiError {
  constructor(message = 'wasm not found', id?: string) {
    message ??= `no wasm file defined for version_id: ${id}`;
    super('WASM_NOT_FOUND', message);
  }
}

export class WasmExecutionNotSaved extends ApiError {
  constructor(readonly message = 'failed to save wasm execution history') {
    super('WASM_EXECUTION_NOT_SAVED', message);
  }
}
