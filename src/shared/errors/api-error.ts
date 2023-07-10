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

export class WasmRecordNotSaved extends ApiException {
  constructor(id: string, cause?: Error) {
    super(HttpStatus.UNPROCESSABLE_ENTITY, `failed to save wasm file records for version_id <${id}>`, cause);
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

export class ExecHistoryNotSaved extends ApiException {
  constructor(id: string, cause?: Error) {
    super(HttpStatus.UNPROCESSABLE_ENTITY, `failed to save wasm execution history <${id}>`, cause);
  }
}

export class BadUploadWasmData extends ApiException {
  constructor(message: string, cause: Error) {
    super(HttpStatus.BAD_REQUEST, message, cause);
  }
}
