import { AddWasmByUriCommandHandler } from './commands/add-wasm-by-uri.cmd';
import { DeleteWasmCommandHandler } from './commands/delete-wasm.cmd';
import { ExecuteWasmCommandHandler } from './commands/execute-wasm.cmd';
import { CreateBatchCommandHandler } from './commands/create-batch.cmd';
import { RunBatchCommandHandler } from './commands/run-batch.cmd';
import { UploadWasmCommandHandler } from './commands/upload-wasm.cmd';
import { BatchCreatedEventHandler } from './events/batch-created.event';
import { DownloadBatchQueryHandler } from './queries/download-batch.query';
import { DownloadHistoryQueryHandler } from './queries/download-history.query';
import { DownloadWasmQueryHandler } from './queries/download-wasm.query';
import { GetBatchQueryHandler } from './queries/get-batch.query';
import { GetHistoryQueryHandler } from './queries/get-history.query';

export * from './commands/add-wasm-by-uri.cmd';
export * from './commands/delete-wasm.cmd';
export * from './commands/execute-wasm.cmd';
export * from './commands/create-batch.cmd';
export * from './commands/run-batch.cmd';
export * from './commands/upload-wasm.cmd';
export * from './dtos/add-wasm-by-uri.dto';
export * from './dtos/execute-wasm.dto';
export * from './dtos/upload-wasm.dto';
export * from './dtos/wasm-file.dto';
export * from './entities/batch-data.entity';
export * from './entities/batch.entity';
export * from './entities/exec-data.entity';
export * from './entities/exec-history.entity';
export * from './events/batch-created.event';
export * from './queries/download-batch.query';
export * from './queries/download-history.query';
export * from './queries/download-wasm.query';
export * from './queries/get-batch.query';
export * from './queries/get-history.query';
export * from './repos/batch.repo';
export * from './repos/wasm.repo';

export const CqrsHandlers = [
  AddWasmByUriCommandHandler,
  DeleteWasmCommandHandler,
  ExecuteWasmCommandHandler,
  CreateBatchCommandHandler,
  RunBatchCommandHandler,
  UploadWasmCommandHandler,
  BatchCreatedEventHandler,
  DownloadWasmQueryHandler,
  DownloadBatchQueryHandler,
  DownloadHistoryQueryHandler,
  GetBatchQueryHandler,
  GetHistoryQueryHandler,
];
