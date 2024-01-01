import { Injectable } from '@nestjs/common';
import { existsSync, readFileSync, appendFileSync, unlinkSync } from 'fs';
import { parse as csvParse } from 'papaparse';
import { join } from 'path';

import { AppConfig } from '@app/modules/config';
import { WasmService } from '@app/common/wasm.service';
import { WasmModel, WasmModelHandler, WasmMapper } from '@infra/wasm';
import { ExecHistoryMapper, ExecHistoryModel, ExecHistoryModelHandler } from '@infra/wasm';
import { IWasmRepo, ExecuteWasmDto, WasmFileDto, ExecHistory, ExecData, WasmData } from '@domain/wasm';
import { WasmFileNotFound, ExecHistoryNotFound, WasmRecordNotSaved, ExecHistoryNotSaved } from '@shared/errors';
import { Paginated, PaginationQueryParams, SortOrder, Spark, ExecResult } from '@shared/utils';
import { WASM_DATA_PATH } from '@shared/constants';

@Injectable()
export class WasmRepo implements IWasmRepo {
  constructor(
    private readonly wasmMapper: WasmMapper,
    private readonly execHistoryMapper: ExecHistoryMapper,
    private readonly appConfig: AppConfig,
    private readonly wasmService: WasmService,
  ) {}

  async getWasmData(params: PaginationQueryParams): Promise<Paginated<WasmData>> {
    const data = this.loadCsvWasm(join(this.appConfig.props.app.uploadPath, WASM_DATA_PATH));

    const total = data.length;
    const [start, end] = Paginated.toIndex(params.page, params.limit);
    const dataset = params.order === SortOrder.ASC ? data : data.reverse();
    const models = dataset.slice(start, end).map((model) => model.asDto);
    return Paginated.from(models, { ...params, total });
  }

  async saveWasm(data: WasmFileDto): Promise<WasmData> {
    const model = this.wasmMapper.toModel(data);
    const path = join(this.appConfig.props.app.uploadPath, WASM_DATA_PATH);
    try {
      if (!existsSync(path)) appendFileSync(path, `${model.headers()}`);
      appendFileSync(path, `\n${model.toCsv()}`);
      return model.asDto;
    } catch (cause) {
      throw new WasmRecordNotSaved(data.versionId, cause);
    }
  }

  async findWasm(versionId: string) {
    let wasm = this.wasmService.getWasm(versionId);

    if (!wasm) {
      const { uploadPath } = this.appConfig.props.app;
      const data = this.loadCsvWasm(join(uploadPath, WASM_DATA_PATH));
      const model = data.find((m) => m.version_id === versionId);
      if (!model) throw new WasmFileNotFound(versionId);

      wasm = await this.wasmService.setWasm(versionId, model.file_path);
    }
    return wasm;
  }

  async execute(versionId: string, dto: ExecuteWasmDto): Promise<ExecData> {
    const wasm = await this.findWasm(versionId);

    const input = Spark.buildRequest(dto.inputs, versionId, dto.shared);
    const start = performance.now();
    const output = await wasm.execute(input);
    const end = performance.now();

    this.saveHistory(versionId, [{ input, output, elapsed: end - start }]);

    return output;
  }

  async getHistory(versionId: string, params: PaginationQueryParams): Promise<Paginated<ExecHistory>> {
    const path = join(this.appConfig.props.app.uploadPath, `${versionId}.csv`);
    return this.loadCsvHistory(path, params);
  }

  async downloadWasm(versionId: string): Promise<Buffer> {
    const path = join(this.appConfig.props.app.uploadPath, `${versionId}.zip`);
    if (!existsSync(path)) throw new WasmFileNotFound(versionId);

    return readFileSync(path);
  }

  async downloadHistory(versionId: string): Promise<Buffer> {
    const path = join(this.appConfig.props.app.uploadPath, `${versionId}.csv`);
    if (!existsSync(path)) throw new ExecHistoryNotFound(versionId);

    return readFileSync(path);
  }

  async deleteWasm(versionId: string): Promise<void> {
    const wasmFilePath = join(this.appConfig.props.app.uploadPath, `${versionId}.zip`);
    const historyFilePath = join(this.appConfig.props.app.uploadPath, `${versionId}.csv`);
    const wasmDataPath = join(process.cwd(), this.appConfig.props.app.uploadPath, WASM_DATA_PATH);

    this.wasmService.remove(versionId); // remove from cache
    if (existsSync(wasmFilePath)) unlinkSync(wasmFilePath); // delete the WASM file
    if (existsSync(historyFilePath)) unlinkSync(historyFilePath); // delete the CSV history file

    const models = csvParse<WasmModel>(readFileSync(wasmDataPath, 'utf8'), { header: true });
    const filtered = models.data.filter((row) => row.version_id !== versionId);
    const updated = filtered.map((row) => new WasmModelHandler({ ...row }).toCsv()).join('\n');

    unlinkSync(wasmDataPath);
    appendFileSync(wasmDataPath, `${models.meta.fields.join(',')}\n${updated}`); // update the WASM data file
  }

  saveHistory(versionId: string, results: ExecResult[]): void {
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

  private loadCsvWasm(filePath: string): WasmModelHandler[] {
    const url = join(process.cwd(), filePath);
    if (!existsSync(url)) return [];

    const parsed = csvParse<WasmModel>(readFileSync(url, 'utf8'), { header: true, skipEmptyLines: true });
    if (parsed.errors.length > 0) return [];

    return parsed.data.map((row) => new WasmModelHandler({ ...row }));
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
}
