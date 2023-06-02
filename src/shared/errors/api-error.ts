export class ApiError extends Error {
  constructor(readonly code: string, readonly message: string) {
    super(message);
  }
}

export class UnprocessedWasmRecord extends ApiError {
  constructor(readonly message = 'failed to save wasm file records') {
    super('UNPROCESSED_WASM', message);
  }
}
