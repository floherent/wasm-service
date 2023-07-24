import { Injectable } from '@nestjs/common';
import { existsSync, readFileSync, appendFileSync, unlinkSync } from 'fs';
import { parse as csvParse } from 'papaparse';
import { join } from 'path';

import { AppConfig } from '@app/modules/config';
import { WasmService } from '@app/modules';
import { WasmModel, WasmModelHandler, WasmMapper, BatchModelHandler, BatchExecModelHandler } from '@infra/wasm';
import { ExecHistoryMapper, ExecHistoryModel, ExecHistoryModelHandler } from '@infra/wasm';
import { IWasmRepo, ExecuteWasmDto, WasmFileDto, ExecHistory, Batch, BatchData, ExecData } from '@domain/wasm';
import { WasmFileNotFound, ExecHistoryNotFound, BatchExecNotSaved } from '@shared/errors';
import { BatchSubmissionNotSaved, WasmRecordNotSaved, ExecHistoryNotSaved } from '@shared/errors';
import { Paginated, PaginationQueryParams, SortOrder, JsonValue, buildRequest, ExecResult } from '@shared/utils';

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

  async executeOne(versionId: string, dto: ExecuteWasmDto): Promise<ExecData> {
    const wasm = await this.findWasm(versionId);

    const input = buildRequest(versionId, dto.inputs);
    const start = performance.now();
    const output = await wasm.execute(input);
    const end = performance.now();

    this.saveHistory(versionId, [{ input, output, elapsed: end - start }]);

    return output;
  }

  async executeMany(versionId: string, dto: ExecuteWasmDto): Promise<BatchData> {
    const wasm = await this.findWasm(versionId);

    const inputs = Array.isArray(dto.inputs) ? dto.inputs : [dto.inputs];
    const results: ExecResult[] = [];

    for (const i of inputs) {
      const input = buildRequest(versionId, i);
      const start = performance.now();
      const output = await wasm.execute(input);
      const end = performance.now();
      results.push({ input, output, elapsed: end - start });
    }

    this.saveHistory(versionId, results);

    return BatchData.from(results);
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

  async runBatch(batch: Batch, records: JsonValue[]) {
    const wasm = await this.findWasm(batch.service_id);
    const requests = records.map((r) => buildRequest(batch.service_id, r));

    const start = performance.now();
    const result = await wasm.executeAll(requests);
    const end = performance.now();

    this.saveBatchExec(batch.id, result);

    return Batch.completed(batch, result.length, result.length, end - start);
  }

  async getHistory(versionId: string, params: PaginationQueryParams): Promise<Paginated<ExecHistory>> {
    const path = join(this.appConfig.props.app.uploadPath, `${versionId}.csv`);
    return this.loadCsvHistory(path, params);
  }

  async download(versionId: string): Promise<Buffer> {
    const path = join(this.appConfig.props.app.uploadPath, `${versionId}.zip`);
    if (!existsSync(path)) throw new WasmFileNotFound(`no wasm file defined for version_id <${versionId}>`);

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
    const wasmDataPath = join(process.cwd(), this.appConfig.props.app.dataPath);

    this.wasmService.remove(versionId); // remove from cache
    if (existsSync(wasmFilePath)) unlinkSync(wasmFilePath); // delete the WASM file
    if (existsSync(historyFilePath)) unlinkSync(historyFilePath); // delete the CSV history file

    const models = csvParse<WasmModel>(readFileSync(wasmDataPath, 'utf8'), { header: true });
    const filtered = models.data.filter((row) => row.version_id !== versionId);
    const updated = filtered.map((row) => new WasmModelHandler({ ...row }).toCsv()).join('\n');

    unlinkSync(wasmDataPath);
    appendFileSync(wasmDataPath, `${models.meta.fields.join(',')}\n${updated}`); // update the WASM data file
  }

  private loadCsvWasm(filePath: string): WasmModelHandler[] {
    const url = join(process.cwd(), filePath);
    if (!existsSync(url)) return [];

    const parsed = csvParse<WasmModel>(readFileSync(url, 'utf8'), { header: true });
    if (parsed.errors.length > 0) return [];

    return parsed.data.map((row) => new WasmModelHandler({ ...row }));
  }

  private saveHistory(versionId: string, results: ExecResult[]): void {
    try {
      const path = join(this.appConfig.props.app.uploadPath, `${versionId}.csv`);
      const models = results.map((result) => {
        return new ExecHistoryModelHandler({
          version_id: versionId,
          inputs: JSON.stringify(result.input.request_data.inputs),
          outputs: JSON.stringify(result.output.response_data.outputs),
          executed_at: Date.now().toString(),
          execution_time: `${result.elapsed.toFixed(2)}ms`,
        });
      });

      if (!existsSync(path)) appendFileSync(path, `${ExecHistoryModelHandler.headers()}`);
      const csv = models.map((m) => m.toCsv()).join('\n');
      appendFileSync(path, `\n${csv}`);
    } catch (cause) {
      throw new ExecHistoryNotSaved(versionId, cause);
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

  private saveBatchExec(batchId: string, results: ExecData[]): void {
    try {
      const path = join(this.appConfig.props.app.uploadPath, `${batchId}_batch_exec.csv`);
      const models = results.map(
        (result) =>
          new BatchExecModelHandler({
            inputs: '{}', // TODO: which inputs to save?
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
