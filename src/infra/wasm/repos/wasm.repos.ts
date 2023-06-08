import { Injectable } from '@nestjs/common';
import { appendFileSync, existsSync, readFileSync } from 'fs';
import { parse as csvParse } from 'papaparse';
import { join } from 'path';

import { AppConfig } from 'src/app.config';
import { WasmService } from '@app/modules/services/wasm.service';
import { WasmMapper, WasmModel, WasmModelHandler } from '@infra/wasm';
import { WasmFileDto, IWasmRepo, ExecuteWasmDto } from '@domain/wasm';
import { UnprocessedWasmRecord } from '@shared/errors';
import { ExecResponseData } from '@shared/utils';

@Injectable()
export class WasmRepo implements IWasmRepo {
  constructor(
    private readonly mapper: WasmMapper,
    private readonly appConfig: AppConfig,
    private readonly wasmService: WasmService,
  ) {}

  async save(data: WasmFileDto): Promise<WasmModel> {
    const model = this.mapper.toModel(data);
    const path = this.appConfig.props.app.dataPath;
    try {
      if (!existsSync(path)) appendFileSync(path, `${model.headers()}`);
      appendFileSync(path, `\n${model.toCsv()}`);
      return model.asDto;
    } catch (_) {
      throw new UnprocessedWasmRecord();
    }
  }

  async execute(versionId: string, dto: ExecuteWasmDto): Promise<ExecResponseData> {
    let wasm = this.wasmService.getWasm(versionId); // try to use cache first.

    if (!wasm) {
      const { dataPath } = this.appConfig.props.app;
      const data = this.extractCsvData(dataPath);
      const model = data.find((m) => m.version_id === versionId);
      if (!model) throw new Error(`no wasm file defined for version id: ${versionId}`);

      const file = readFileSync(model.path, 'binary');
      wasm = this.wasmService.setWasm(versionId, Buffer.from(file, 'binary')); // cache it until invalidated.
    }

    const request = {
      request_data: { ...dto },
      request_meta: {
        version_id: versionId,
        call_purpose: 'Spark - WASM Tester',
        source_system: 'SPARK',
        correlation_id: '',
        requested_output: null,
        service_category: '',
      },
    };

    return (await wasm.execute(request, versionId)) as ExecResponseData;
    // return {
    //   response_data: { outputs: { ...dto } },
    //   response_meta: {
    //     version_id: versionId,
    //     call_purpose: 'Spark - WASM Tester',
    //     source_system: 'SPARK',
    //     correlation_id: '',
    //     requested_output: null,
    //     service_category: '',
    //   },
    // } as ExecResponseData;
  }

  private extractCsvData(filePath: string): WasmModelHandler[] {
    const url = join(process.cwd(), filePath);
    if (!existsSync(url)) return [];

    const parsed = csvParse<WasmModel>(readFileSync(url, 'utf8'), { header: true });
    if (parsed.errors.length > 0) return [];

    return parsed.data.map((row) => new WasmModelHandler({ ...row }));
  }
}
