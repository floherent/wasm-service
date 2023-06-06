import { WasmModel } from '@infra/wasm';
import { WasmFile } from '../entities/wasm.entity';

export interface IWasmRepo {
  save: (data: WasmFile) => Promise<WasmModel>;
}
