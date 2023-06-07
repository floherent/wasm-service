import { Injectable } from '@nestjs/common';
import { appendFileSync, existsSync, readFileSync } from 'fs';
import { Spark } from '@coherentglobal/spark-execute-sdk';
import { parse as csvParse } from 'papaparse';
import { join } from 'path';

import { AppConfig } from 'src/app.config';
import { WasmMapper, WasmModel } from '@infra/wasm';
import { WasmFile, IWasmRepo, ExecuteWasmDto } from '@domain/wasm';
import { UnprocessedWasmRecord } from '@shared/errors';
import { ExecResponseData } from '@shared/utils';

@Injectable()
export class WasmRepo implements IWasmRepo {
  constructor(private mapper: WasmMapper, private appConfig: AppConfig) {}

  async save(data: WasmFile): Promise<WasmModel> {
    const model = this.mapper.toModel(data);
    const path = AppConfig.getInstance().config.app.dataPath;
    try {
      if (!existsSync(path)) appendFileSync(path, `${model.headers()}`);
      appendFileSync(path, `\n${model.toCsv()}`);
      return model;
    } catch (_) {
      throw new UnprocessedWasmRecord();
    }
  }

  async execute(versionId: string, dto: ExecuteWasmDto): Promise<ExecResponseData> {
    const { dataPath } = this.appConfig.config.app;
    const data = extractCsvData(dataPath);
    const model = data.find((m) => m.version_id === versionId);
    if (!model) throw new Error('version id not found');

    const buffer = readFileSync(model.path);
    const binary = buffer.toString('binary');
    const zipfile = Buffer.from(binary, 'binary').toString('base64');
    return await executeModel(versionId, dto, zipfile);
  }
}

const extractCsvData = (filePath: string): WasmModel[] => {
  const url = join(process.cwd(), filePath);
  if (!existsSync(url)) return [];

  const parsed = csvParse<WasmModel>(readFileSync(url, 'utf8'), { header: true });
  if (parsed.errors.length > 0) return [];

  return parsed.data.map((row) => new WasmModel({ ...row }));
};

const executeModel = async (versionId: string, data: ExecuteWasmDto, zip: string) => {
  const request = {
    request_data: { ...data },
    request_meta: {
      version_id: versionId,
      call_purpose: 'Spark - WASM Tester',
      source_system: 'SPARK',
      correlation_id: '',
      requested_output: null,
      service_category: '',
    },
  };

  const spark = new Spark({
    nodeGenModels: [
      {
        versionId: versionId,
        type: 'base64',
        binary: zip,
        metaData: {},
      },
    ],
  });

  return (await spark.execute(request, versionId)) as ExecResponseData;
};
