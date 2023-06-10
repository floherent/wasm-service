import { ExecHistoryModel, WasmModel } from '@infra/wasm';
import { ExecResponseData, Paginated, PaginationQueryParams } from '@shared/utils';
import { WasmFileDto } from '../dtos/wasm-file.dto';
import { ExecuteWasmDto } from '../dtos/execute-wasm.dto';

export interface IWasmRepo {
  save: (dto: WasmFileDto) => Promise<WasmModel>;
  execute: (versionId: string, dto: ExecuteWasmDto) => Promise<ExecResponseData>;
  getHistory: (versionId: string, params: PaginationQueryParams) => Promise<Paginated<ExecHistoryModel>>;
}
