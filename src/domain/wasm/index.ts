import { DeleteWasmCommandHandler } from './commands/delete-wasm.cmd';
import { ExecuteWasmCommandHandler } from './commands/execute-wasm.cmd';
import { UploadWasmCommandHandler } from './commands/upload-wasm.cmd';
import { DownloadWasmQueryHandler } from './queries/download-wasm.query';
import { GetHistoryQueryHandler } from './queries/get-history.query';

export * from './commands/delete-wasm.cmd';
export * from './commands/execute-wasm.cmd';
export * from './commands/upload-wasm.cmd';
export * from './dtos/execute-wasm.dto';
export * from './dtos/upload-wasm.dto';
export * from './dtos/wasm-file.dto';
export * from './entities/exec-history.entity';
export * from './queries/download-wasm.query';
export * from './queries/get-history.query';
export * from './repos/wasm.repo';

export const CqrsHandlers = [
  DeleteWasmCommandHandler,
  ExecuteWasmCommandHandler,
  UploadWasmCommandHandler,
  DownloadWasmQueryHandler,
  GetHistoryQueryHandler,
];
