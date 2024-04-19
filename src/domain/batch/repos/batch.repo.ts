import { JsonValue } from '@shared/utils';
import { ExecuteWasmDto } from '../../wasm/dtos/execute-wasm.dto';
import { Batch } from '../entities/batch.entity';
import { BatchData } from '../entities/batch-data.entity';
import { BatchExec } from '../entities/batch.exec.entity';

export interface IBatchRepo {
  executeSync: (serviceId: string, dto: ExecuteWasmDto) => Promise<BatchData>;
  executeAsync: (
    batch: Batch,
    records: JsonValue[],
    metadata?: Record<string, any>,
    shared?: JsonValue,
  ) => Promise<Batch>;
  create: (serviceId: string, clientId: string, bufferSize: number, totalRecords: number) => Promise<Batch>;
  findOne: (batchId: string) => Promise<Batch>;
  getResult: (batchId: string) => Promise<BatchExec[]>;
  downloadResult: (batchId: string) => Promise<Buffer>;
  deleteResults: (batchIds: string[]) => Promise<number>;
}
