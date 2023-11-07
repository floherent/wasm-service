import { JsonValue } from '@shared/utils';
import { ExecuteWasmDto } from '../dtos/execute-wasm.dto';
import { Batch } from '../entities/batch.entity';
import { BatchData } from '../entities/batch-data.entity';

export interface IBatchRepo {
  executeSync: (versionId: string, dto: ExecuteWasmDto) => Promise<BatchData>;
  executeAsync: (batch: Batch, records: JsonValue[]) => Promise<Batch>;
  create: (versionId: string, clientId: string, size: number) => Promise<Batch>;
  findOne: (versionId: string, batchId: string) => Promise<Batch>;
  download: (batchId: string) => Promise<Buffer>;
}
