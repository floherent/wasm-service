import { ExecResult, Paginated, PaginationQueryParams, Spark } from '@shared/utils';
import { WasmFileDto } from '../dtos/wasm-file.dto';
import { ExecuteWasmDto } from '../dtos/execute-wasm.dto';
import { ExecHistory } from '../entities/exec-history.entity';
import { ExecData } from '../entities/exec-data.entity';
import { WasmData } from '../entities/wasm-data.entity';

export interface IWasmRepo {
  execute: (id: string, dto: ExecuteWasmDto) => Promise<ExecData>;
  saveWasm: (dto: WasmFileDto) => Promise<WasmData>;
  getWasmData: (params: PaginationQueryParams) => Promise<Paginated<WasmData>>;
  findWasm: (id: string) => Promise<Spark>;
  downloadWasm: (id: string) => Promise<Buffer>;
  deleteWasm: (id: string) => Promise<void>;
  saveHistory: (id: string, data: ExecResult[]) => void;
  getHistory: (id: string, params: PaginationQueryParams) => Promise<Paginated<ExecHistory>>;
  downloadHistory: (id: string) => Promise<Buffer>;
}
