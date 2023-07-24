import { WasmModel } from '@infra/wasm';
import { JsonValue, Paginated, PaginationQueryParams } from '@shared/utils';
import { WasmFileDto } from '../dtos/wasm-file.dto';
import { ExecuteWasmDto } from '../dtos/execute-wasm.dto';
import { ExecHistory } from '../entities/exec-history.entity';
import { Batch } from '../entities/batch.entity';
import { ExecData } from '../entities/exec-data.entity';
import { BatchData } from '../entities/batch-data.entity';

export interface IWasmRepo {
  save: (dto: WasmFileDto) => Promise<WasmModel>;
  executeOne: (versionId: string, dto: ExecuteWasmDto) => Promise<ExecData>;
  executeMany: (versionId: string, dto: ExecuteWasmDto) => Promise<BatchData>;
  createBatch: (versionId: string, clientId: string, dto: ExecuteWasmDto[]) => Promise<Batch>;
  runBatch: (batch: Batch, records: JsonValue[]) => Promise<Batch>;
  getHistory: (versionId: string, params: PaginationQueryParams) => Promise<Paginated<ExecHistory>>;
  downloadHistory: (versionId: string) => Promise<Buffer>;
  delete: (versionId: string) => Promise<void>;
  download: (versionId: string) => Promise<Buffer>;
}
