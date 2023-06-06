import { Injectable } from '@nestjs/common';
import { appendFileSync, existsSync } from 'fs';

import { AppConfig } from 'src/app.config';
import { WasmMapper, WasmModel } from '@infra/wasm';
import { WasmFile, IWasmRepo } from '@domain/wasm';
import { UnprocessedWasmRecord } from '@shared/errors';

@Injectable()
export class WasmRepo implements IWasmRepo {
  constructor(private mapper: WasmMapper) {}

  async save(data: WasmFile): Promise<WasmModel> {
    const model = this.mapper.toModel(data);
    const path = AppConfig.getInstance().config.app.dataPath;
    try {
      if (!existsSync(path)) appendFileSync(path, `${model.headers}\n`);
      appendFileSync(path, `${model.toString()}\n`);
      return model;
    } catch (_) {
      throw new UnprocessedWasmRecord();
    }
  }
}
