import { Injectable } from '@nestjs/common';
import { appendFileSync, existsSync } from 'fs';

import { WasmMapper } from '../mappers/wasm.mapper';
import { WasmFile, IWasmRepo } from '@domain/wasm';
import { DEFAULT_OUTPUT_FILE_PATH } from '@shared/constants';
import { UnprocessedWasmRecord } from '@shared/errors';

@Injectable()
export class WasmRepo implements IWasmRepo {
  constructor(private mapper: WasmMapper) {}

  async save(data: WasmFile): Promise<WasmFile> {
    const model = this.mapper.toModel(data);
    try {
      if (!existsSync(DEFAULT_OUTPUT_FILE_PATH)) appendFileSync(DEFAULT_OUTPUT_FILE_PATH, model.headers + '\n');
      appendFileSync(DEFAULT_OUTPUT_FILE_PATH, model.toString() + '\n');
      return data;
    } catch (_) {
      throw new UnprocessedWasmRecord();
    }
  }
}
