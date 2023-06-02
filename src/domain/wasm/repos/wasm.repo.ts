import { WasmFile } from '../entities/wasm.entity';

export interface IWasmRepo {
  save: (data: WasmFile) => Promise<WasmFile>;
}
