import { AddWasmByUriCommandHandler } from './commands/add-wasm-by-uri.cmd';
import { DeleteWasmCommandHandler } from './commands/delete-wasm.cmd';
import { ExecuteWasmCommandHandler } from './commands/execute-wasm.cmd';
import { UploadWasmCommandHandler } from './commands/upload-wasm.cmd';

import { DownloadHistoryQueryHandler } from './queries/download-history.query';
import { DownloadWasmQueryHandler } from './queries/download-wasm.query';
import { GetHistoryQueryHandler } from './queries/get-history.query';
import { GetWasmDataQueryHandler } from './queries/get-wasm-data.query';
import { GetValidationsQueryHandler } from './queries/get-validations.query';

export * from './commands/add-wasm-by-uri.cmd';
export * from './commands/delete-wasm.cmd';
export * from './commands/execute-wasm.cmd';
export * from './commands/upload-wasm.cmd';
export * from './dtos/add-wasm-by-uri.dto';
export * from './dtos/execute-wasm.dto';
export * from './dtos/upload-wasm.dto';
export * from './dtos/wasm-file.dto';
export * from './dtos/wasm-validation.dto';
export * from './entities/exec-data.entity';
export * from './entities/exec-history.entity';
export * from './entities/wasm-data.entity';
export * from './entities/wasm-validations.entity';

export * from './queries/download-history.query';
export * from './queries/download-wasm.query';
export * from './queries/get-history.query';
export * from './queries/get-wasm-data.query';
export * from './queries/get-validations.query';
export * from './repos/wasm.repo';

export const CqrsHandlers = [
  AddWasmByUriCommandHandler,
  DeleteWasmCommandHandler,
  ExecuteWasmCommandHandler,
  UploadWasmCommandHandler,
  DownloadWasmQueryHandler,
  DownloadHistoryQueryHandler,
  GetHistoryQueryHandler,
  GetWasmDataQueryHandler,
  GetValidationsQueryHandler,
];
