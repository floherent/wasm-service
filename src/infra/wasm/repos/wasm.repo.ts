import { Injectable } from '@nestjs/common';
import { existsSync, readFileSync, appendFileSync, unlinkSync } from 'fs';
import { parse as csvParse } from 'papaparse';
import { join } from 'path';

import { AppConfig } from '@app/modules/config';
import { WasmService } from '@app/modules';
import { WasmModel, WasmModelHandler, WasmMapper } from '@infra/wasm';
import { ExecHistoryMapper, ExecHistoryModel, ExecHistoryModelHandler } from '@infra/wasm';
import { IWasmRepo, ExecuteWasmDto, WasmFileDto, ExecHistory } from '@domain/wasm';
import { WasmNotFound, WasmRecordNotSaved, WasmExecutionNotSaved } from '@shared/errors';
import { ExecResponseData, Paginated, PaginationQueryParams, SortOrder } from '@shared/utils';

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
    } catch (_) {
      throw new WasmRecordNotSaved();
    }
  }

  async execute(versionId: string, dto: ExecuteWasmDto): Promise<ExecResponseData> {
    let wasm = this.wasmService.getWasm(versionId); // try to use cache first.

    if (!wasm) {
      const { dataPath } = this.appConfig.props.app;
      const data = this.loadCsvWasm(dataPath);
      const model = data.find((m) => m.version_id === versionId);
      if (!model) throw new WasmNotFound(`no wasm file defined for version_id: ${versionId}`);

      wasm = await this.wasmService.setWasm(versionId, model.path); // cache it until invalidated.
    }

    const request = {
      request_data: { ...dto },
      request_meta: {
        version_id: versionId,
        call_purpose: 'Offline Execution',
        source_system: 'wasm-service',
        correlation_id: '',
        requested_output: null,
        compiler_type: null,
        service_category: '',
      },
    };

    const startTime = performance.now();
    const result = (await wasm.execute(versionId, request)) as ExecResponseData;
    const endTime = performance.now();

    this.saveHistory(result, dto, endTime - startTime);
    return result;
  }

  async getHistory(versionId: string, params: PaginationQueryParams): Promise<Paginated<ExecHistory>> {
    const path = join(this.appConfig.props.app.uploadPath, `${versionId}.csv`);
    return this.loadCsvHistory(path, params);
  }

  async download(versionId: string): Promise<Buffer> {
    const path = join(this.appConfig.props.app.uploadPath, `${versionId}.zip`);
    if (!existsSync(path)) throw new WasmNotFound(`no wasm file defined for version_id: ${versionId}`);

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

  private saveHistory(result: ExecResponseData, dto: ExecuteWasmDto, execTime: number): void {
    try {
      // FIXME: implement bucketing for save.
      const version_id = result.response_meta.version_id;
      const path = join(this.appConfig.props.app.uploadPath, `${version_id}.csv`);
      const model = new ExecHistoryModelHandler({
        version_id,
        inputs: JSON.stringify(dto.inputs),
        outputs: JSON.stringify(result.response_data.outputs),
        executed_at: `${Date.now()}`,
        execution_time: `${execTime.toFixed(2)}ms`,
      });

      if (!existsSync(path)) appendFileSync(path, `${model.headers()}`);
      appendFileSync(path, `\n${model.toCsv()}`);
    } catch (_) {
      throw new WasmExecutionNotSaved();
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
}
