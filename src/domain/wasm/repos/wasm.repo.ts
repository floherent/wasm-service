import { WasmModel } from '@infra/wasm';
import { ExecResponseData } from '@shared/utils';
import { WasmFile } from '../entities/wasm.entity';
import { ExecuteWasmDto } from '../dtos/execute-wasm.dto';

export interface IWasmRepo {
  save: (data: WasmFile) => Promise<WasmModel>;
  execute: (versionId: string, dto: ExecuteWasmDto) => Promise<ExecResponseData>;
}
