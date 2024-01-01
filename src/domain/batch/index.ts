import { CreateBatchCommandHandler } from './commands/create-batch.cmd';
import { RunBatchCommandHandler } from './commands/run-batch.cmd';
import { BatchCreatedEventHandler } from './events/batch-created.event';
import { DeleteBatchResultsCommandHandler } from './commands/delete-result.cmd';

import { GetBatchQueryHandler } from './queries/get-batch.query';
import { GetBatchResultQueryHandler } from './queries/get-batch-result.query';
import { GetBatchFileQueryHandler } from './queries/get-batch-file.query';

export * from './commands/create-batch.cmd';
export * from './commands/run-batch.cmd';
export * from './commands/delete-result.cmd';
export * from './events/batch-created.event';

export * from './queries/get-batch.query';
export * from './queries/get-batch-result.query';
export * from './queries/get-batch-file.query';

export * from './repos/batch.repo';
export * from './entities/batch-data.entity';
export * from './entities/batch.entity';
export * from './entities/batch.exec.entity';
export * from './dtos/ids.dto';

export const CqrsHandlers = [
  CreateBatchCommandHandler,
  RunBatchCommandHandler,
  BatchCreatedEventHandler,
  GetBatchQueryHandler,
  GetBatchResultQueryHandler,
  GetBatchFileQueryHandler,
  DeleteBatchResultsCommandHandler,
];
