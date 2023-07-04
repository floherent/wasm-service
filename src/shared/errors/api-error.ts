import { HttpException, HttpStatus } from '@nestjs/common';

export class ApiException extends HttpException {
  constructor(code: string, status?: number, message?: string, cause?: Error) {
    status ??= HttpStatus.UNPROCESSABLE_ENTITY;
    message ??= 'unable to fully process request';
    super({ status, message, code, cause }, status, { cause });
  }
}

export class WasmRecordNotSaved extends ApiException {
  constructor(id: string, cause?: Error) {
    super(
      'WASM_RECORD_NOT_SAVED',
      HttpStatus.UNPROCESSABLE_ENTITY,
      `failed to save wasm file records for version_id: ${id}`,
      cause,
    );
  }
}

export class ExecHistoryNotFound extends ApiException {
  constructor(id: string, cause?: Error) {
    super(
      'EXECUTION_HISTORY_NOT_FOUND',
      HttpStatus.NOT_FOUND,
      `no execution history file found for version_id: ${id}`,
      cause,
    );
  }
}

export class WasmFileNotFound extends ApiException {
  constructor(id: string, cause?: Error) {
    super('WASM_FILE_NOT_FOUND', HttpStatus.NOT_FOUND, `no wasm file found for version_id: ${id}`, cause);
  }
}

export class ExecHistoryNotSaved extends ApiException {
  constructor(id: string, cause?: Error) {
    super(
      'EXECUTION_HISTORY_NOT_SAVED',
      HttpStatus.UNPROCESSABLE_ENTITY,
      `failed to save wasm execution history ${id}`,
      cause,
    );
  }
}

export class BatchSubmissionNotSaved extends ApiException {
  constructor(id: string, cause?: Error) {
    super(
      'BATCH_SUBMISSION_NOT_SAVED',
      HttpStatus.UNPROCESSABLE_ENTITY,
      `failed to save batch submission for wasm ${id}`,
      cause,
    );
  }
}

export class BatchExecNotSaved extends ApiException {
  constructor(id: string, cause?: Error) {
    super('BATCH_EXECUTION_NOT_SAVED', HttpStatus.UNPROCESSABLE_ENTITY, `failed to save batch execution ${id}`, cause);
  }
}

export class BadUploadWasmData extends ApiException {
  constructor(message: string, cause: Error) {
    super('WRONG_UPLOAD_WASM_DATA', HttpStatus.BAD_REQUEST, message, cause);
  }
}
