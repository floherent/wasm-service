import { HttpException, HttpStatus } from '@nestjs/common';

export interface ApiError {
  status: number;
  message: string;
  cause?: unknown | Error;
}

export class ApiException extends HttpException {
  constructor(status?: number, message?: string, cause?: unknown | Error) {
    status ??= HttpStatus.UNPROCESSABLE_ENTITY;
    message ??= 'unable to fully process request';
    super({ status, message, cause }, status);
  }
}

export class WasmRunnerNotCreated extends ApiException {
  constructor(message = 'failed to create wasm runner', cause?: Error) {
    super(HttpStatus.UNPROCESSABLE_ENTITY, message, cause);
  }
}

export class WasmRecordNotSaved extends ApiException {
  constructor(id: string, cause?: Error) {
    super(null, `failed to save wasm file records for version_id <${id}>`, cause);
  }
}

export class ExecHistoryNotFound extends ApiException {
  constructor(id: string, cause?: Error) {
    super(HttpStatus.NOT_FOUND, `no execution history file found for version_id <${id}>`, cause);
  }
}

export class WasmFileNotFound extends ApiException {
  constructor(id: string, cause?: Error) {
    super(HttpStatus.NOT_FOUND, `no wasm file found for version_id <${id}>`, cause);
  }
}

export class RecordsNotFound extends ApiException {
  constructor(id: string, cause?: Error) {
    super(HttpStatus.NOT_FOUND, `no records found for id <${id}>`, cause);
  }
}

export class ExecHistoryNotSaved extends ApiException {
  constructor(id: string, cause?: Error) {
    super(null, `failed to save wasm execution history <${id}>`, cause);
  }
}

export class BatchSubmissionNotSaved extends ApiException {
  constructor(id: string, cause?: Error) {
    super(HttpStatus.UNPROCESSABLE_ENTITY, `failed to save batch submission for wasm <${id}>`, cause);
  }
}

export class BatchExecNotSaved extends ApiException {
  constructor(id: string, cause?: Error) {
    super(null, `failed to save batch execution ${id}`, cause);
  }
}

export class BatchResultsNotFound extends ApiException {
  constructor(id: string, cause?: Error) {
    super(HttpStatus.NOT_FOUND, `no results found for batch_id <${id}>`, cause);
  }
}

export class RateLimitExceeded extends ApiException {
  constructor(message = 'rate limit exceeded', cause?: Error) {
    super(HttpStatus.TOO_MANY_REQUESTS, message, cause);
  }
}

export class BadUploadWasmData extends ApiException {
  constructor(message: string, cause: Error) {
    super(HttpStatus.BAD_REQUEST, message, cause);
  }
}
