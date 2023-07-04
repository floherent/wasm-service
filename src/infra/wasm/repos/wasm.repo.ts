import { Injectable, Logger } from '@nestjs/common';
import { existsSync, readFileSync, appendFileSync, unlinkSync } from 'fs';
import { parse as csvParse } from 'papaparse';
import { join } from 'path';

import { AppConfig } from '@app/modules/config';
import { WasmService } from '@app/modules';
import { WasmModel, WasmModelHandler, WasmMapper, BatchModelHandler, BatchExecModelHandler } from '@infra/wasm';
import { ExecHistoryMapper, ExecHistoryModel, ExecHistoryModelHandler } from '@infra/wasm';
import { IWasmRepo, ExecuteWasmDto, WasmFileDto, ExecHistory, Batch } from '@domain/wasm';
import { WasmFileNotFound, ExecHistoryNotFound, BatchExecNotSaved } from '@shared/errors';
import { BatchSubmissionNotSaved, WasmRecordNotSaved, ExecHistoryNotSaved } from '@shared/errors';
import { ExecResponseData, JsonValue, Paginated, PaginationQueryParams, SortOrder, buildRequest } from '@shared/utils';

@Injectable()
export class WasmRepo implements IWasmRepo {
  constructor(
    private readonly wasmMapper: WasmMapper,
    private readonly execHistoryMapper: ExecHistoryMapper,
    private readonly appConfig: AppConfig,
    private readonly wasmService: WasmService,
  ) {}

  async save(data: WasmFileDto): Promise<WasmModel> {
    const model = this.wasmMapper.toModel(data);
    const path = this.appConfig.props.app.dataPath;
    try {
      if (!existsSync(path)) appendFileSync(path, `${model.headers()}`);
      appendFileSync(path, `\n${model.toCsv()}`);
      return model.asDto;
    } catch (cause) {
      throw new WasmRecordNotSaved(data.versionId, cause);
    }
  }

  async execute(versionId: string, dto: ExecuteWasmDto): Promise<ExecResponseData> {
    const wasm = await this.findWasm(versionId);
    const request = buildRequest(versionId, dto.inputs);

    const startTime = performance.now();
    const result = (await wasm.execute(request)) as ExecResponseData;
    const endTime = performance.now();

    this.saveHistory(result, dto.inputs, endTime - startTime);
    return result;
  }

  async createBatch(versionId: string, clientId: string, dto: ExecuteWasmDto[]): Promise<Batch> {
    const batch = Batch.created(versionId, clientId, dto.length);
    try {
      const path = join(this.appConfig.props.app.uploadPath, `${versionId}_batch.csv`);
      const model = new BatchModelHandler({ ...batch });

      if (!existsSync(path)) appendFileSync(path, `${model.headers()}`);
      appendFileSync(path, `\n${model.toCsv()}`);
    } catch (cause) {
      throw new BatchSubmissionNotSaved(versionId, cause);
    }
    return batch;
  }

  async executeBatch(batch: Batch, records: JsonValue[]) {
    const wasm = await this.findWasm(batch.service_id);
    const requests = records.map((r) => buildRequest(batch.service_id, r));
    const startTime = performance.now();
    const result = await wasm.executeAll(requests);
    const endTime = performance.now();

    this.saveBatchExec(batch.id, result);
    return Batch.completed(batch, result.length, result.length, endTime - startTime);
  }

  async getHistory(versionId: string, params: PaginationQueryParams): Promise<Paginated<ExecHistory>> {
    const path = join(this.appConfig.props.app.uploadPath, `${versionId}.csv`);
    return this.loadCsvHistory(path, params);
  }

  async download(versionId: string): Promise<Buffer> {
    const path = join(this.appConfig.props.app.uploadPath, `${versionId}.zip`);
    if (!existsSync(path)) throw new WasmFileNotFound(`no wasm file defined for version_id: ${versionId}`);

    return readFileSync(path);
  }

  async downloadHistory(versionId: string): Promise<Buffer> {
    const path = join(this.appConfig.props.app.uploadPath, `${versionId}.csv`);
    if (!existsSync(path)) throw new ExecHistoryNotFound(versionId);

    return readFileSync(path);
  }

  async delete(versionId: string): Promise<void> {
    const wasmFilePath = join(this.appConfig.props.app.uploadPath, `${versionId}.zip`);
    const historyFilePath = join(this.appConfig.props.app.uploadPath, `${versionId}.csv`);

    if (existsSync(wasmFilePath)) unlinkSync(wasmFilePath); // delete the WASM file
    if (existsSync(historyFilePath)) unlinkSync(historyFilePath); // delete the CSV history file
  }

  private loadCsvWasm(filePath: string): WasmModelHandler[] {
    const url = join(process.cwd(), filePath);
    if (!existsSync(url)) return [];

    const parsed = csvParse<WasmModel>(readFileSync(url, 'utf8'), { header: true });
    if (parsed.errors.length > 0) return [];

    return parsed.data.map((row) => new WasmModelHandler({ ...row }));
  }

  private saveHistory(result: ExecResponseData, inputs: JsonValue, execTime: number): void {
    try {
      // FIXME: implement bucketing for save.
      const version_id = result.response_meta.version_id;
      const path = join(this.appConfig.props.app.uploadPath, `${version_id}.csv`);
      const model = new ExecHistoryModelHandler({
        version_id,
        inputs: JSON.stringify(inputs),
        outputs: JSON.stringify(result.response_data.outputs),
        executed_at: `${Date.now()}`,
        execution_time: `${execTime.toFixed(2)}ms`,
      });

      if (!existsSync(path)) appendFileSync(path, `${model.headers()}`);
      appendFileSync(path, `\n${model.toCsv()}`);
    } catch (cause) {
      throw new ExecHistoryNotSaved(result.response_meta.version_id, cause);
    }
  }

  private loadCsvHistory(filePath: string, params: PaginationQueryParams): Paginated<ExecHistory> {
    const url = join(process.cwd(), filePath);
    if (!existsSync(url)) return Paginated.empty({ ...params, total: 0 });

    const parsed = csvParse<ExecHistoryModel>(readFileSync(url, 'utf8'), { header: true, delimiter: '|' });
    if (parsed.errors.length > 0) return Paginated.empty({ ...params, total: 0 });

    const total = parsed.data.length;
    const [start, end] = Paginated.toIndex(params.page, params.limit);
    const dataset = params.order === SortOrder.ASC ? parsed.data : parsed.data.reverse();
    const models = dataset.slice(start, end).map((row) => new ExecHistoryModelHandler({ ...row }).asDto);
    const history = this.execHistoryMapper.reverseAll(models);
    return Paginated.from(history, { ...params, total });
  }

  private async findWasm(versionId: string) {
    let wasm = this.wasmService.getWasm(versionId);

    if (!wasm) {
      const { dataPath } = this.appConfig.props.app;
      const data = this.loadCsvWasm(dataPath);
      const model = data.find((m) => m.version_id === versionId);
      if (!model) throw new WasmFileNotFound(versionId);

      wasm = await this.wasmService.setWasm(versionId, model.file_path);
    }
    return wasm;
  }

  private saveBatchExec(batchId: string, results: ExecResponseData[]): void {
    try {
      const path = join(this.appConfig.props.app.uploadPath, `${batchId}_batch_exec.csv`);
      const models = results.map(
        (result) =>
          new BatchExecModelHandler({
            inputs: '{}',
            outputs: JSON.stringify(result?.response_data?.outputs),
            process_time: `${result?.response_meta?.process_time}ms`,
          }),
      );

      const content = BatchExecModelHandler.headers() + '\n' + models.map((m) => m.toCsv()).join('\n');
      appendFileSync(path, content);
    } catch (cause) {
      throw new BatchExecNotSaved(batchId, cause);
    }
  }
}
