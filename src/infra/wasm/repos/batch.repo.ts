import { Injectable, Inject, Logger } from '@nestjs/common';
import { existsSync, appendFileSync, writeFileSync, readFileSync } from 'fs';
import { parse as csvParse } from 'papaparse';
import { join } from 'path';

import { AppConfig } from '@app/modules/config';
import { BatchModelHandler, BatchExecModelHandler, BatchModel, BatchMapper } from '@infra/wasm';
import { IBatchRepo, ExecuteWasmDto, Batch, BatchData, ExecData, IWasmRepo } from '@domain/wasm';
import { BatchSubmissionNotSaved, BatchExecNotSaved, RecordsNotFound } from '@shared/errors';
import { BatchResultsNotFound } from '@shared/errors';
import { JsonValue, buildRequest, ExecResult, Duration } from '@shared/utils';

@Injectable()
export class BatchRepo implements IBatchRepo {
  constructor(
    @Inject('IWasmRepo') private readonly wasmRepo: IWasmRepo,
    private readonly batchMapper: BatchMapper,
    private readonly appConfig: AppConfig,
  ) {}

  async executeSync(versionId: string, dto: ExecuteWasmDto): Promise<BatchData> {
    const wasm = await this.wasmRepo.findWasm(versionId);

    const inputs = Array.isArray(dto.inputs) ? dto.inputs : [dto.inputs];
    const results: ExecResult[] = [];

    for (const i of inputs) {
      const input = buildRequest(versionId, i);
      const start = performance.now();
      const output = await wasm.execute(input);
      const end = performance.now();
      results.push({ input, output, elapsed: end - start });
    }

    this.wasmRepo.saveHistory(versionId, results);

    return BatchData.from(results);
  }

  async create(versionId: string, clientId: string, dto: ExecuteWasmDto[]): Promise<Batch> {
    const batch = Batch.created(versionId, clientId, dto.length);
    try {
      const path = join(this.appConfig.props.app.uploadPath, `${versionId}_batch.csv`);
      const model = this.batchMapper.toModel(batch);

      if (!existsSync(path)) appendFileSync(path, `${BatchModelHandler.headers()}`);
      appendFileSync(path, `\n${model.toCsv()}`);
    } catch (cause) {
      throw new BatchSubmissionNotSaved(versionId, cause);
    }
    return batch;
  }

  async executeAsync(batch: Batch, records: JsonValue[]) {
    const wasm = await this.wasmRepo.findWasm(batch.service_id);
    const requests = records.map((r) => buildRequest(batch.service_id, r));

    this.updateCsvBatch(Batch.updated(batch));

    const start = performance.now();
    let totalProcessed = 0;
    await wasm.executeAll(requests, (processed) => {
      try {
        totalProcessed += processed.length;
        const duration = performance.now() - start;
        const status = totalProcessed === requests.length ? 'completed' : 'processing';
        this.updateCsvBatch(Batch.updated(batch, status, totalProcessed, totalProcessed, duration));
        this.saveBatchExec(batch.id, processed);
        Logger.log(
          `batch <${batch.id}> updated: ${totalProcessed} of ${requests.length} about ${Duration.from(duration).ago}`,
        );
      } catch (cause) {
        const exception = new BatchExecNotSaved(batch.id, cause);
        Logger.warn(exception.getResponse());
      }
    });

    requests.length = 0;
    return Batch.completed(batch, totalProcessed, totalProcessed, performance.now() - start);
  }

  async findOne(versionId: string, batchId: string): Promise<Batch> {
    const dataPath = join(this.appConfig.props.app.uploadPath, `${versionId}_batch.csv`);
    const data = this.loadCsvBatch(dataPath);
    const model = data.find((m) => m.id === batchId);
    if (!model) throw new RecordsNotFound(batchId);

    return model.toBatch();
  }

  async download(batchId: string): Promise<Buffer> {
    const path = join(this.appConfig.props.app.uploadPath, `${batchId}_batch_exec.csv`);
    if (!existsSync(path)) throw new BatchResultsNotFound(batchId);

    return readFileSync(path);
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

  private loadCsvBatch(filePath: string): BatchModelHandler[] {
    const url = join(process.cwd(), filePath);
    if (!existsSync(url)) return [];

    const parsed = csvParse<BatchModel>(readFileSync(url, 'utf8'), { header: true });
    if (parsed.errors.length > 0) return [];

    return parsed.data.map((row) => new BatchModelHandler({ ...row }));
  }

  private updateCsvBatch(batch: Batch): void {
    const dataPath = join(this.appConfig.props.app.uploadPath, `${batch.service_id}_batch.csv`);
    const data = this.loadCsvBatch(dataPath);

    for (const i in data) {
      if (data[i].id === batch.id) {
        data[i] = this.batchMapper.toModel(batch);
        break;
      }
    }

    const updated = data.map((row) => row.toCsv()).join('\n');
    writeFileSync(dataPath, `${BatchModelHandler.headers()}\n${updated}`);
  }
}