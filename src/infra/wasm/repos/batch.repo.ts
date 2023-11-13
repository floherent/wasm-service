import { Injectable, Inject, Logger } from '@nestjs/common';
import { existsSync, appendFileSync, writeFileSync, readFileSync } from 'fs';
import { parse as csvParse } from 'papaparse';
import { join } from 'path';

import { AppConfig } from '@app/modules/config';
import { SocketService } from '@app/modules/socket';
import { BatchModelHandler, BatchExecModelHandler, BatchModel, BatchMapper } from '@infra/wasm';
import { IBatchRepo, ExecuteWasmDto, Batch, BatchData, ExecData, IWasmRepo } from '@domain/wasm';
import { BatchSubmissionNotSaved, BatchExecNotSaved, RecordsNotFound } from '@shared/errors';
import { BatchResultsNotFound, RateLimitExceeded } from '@shared/errors';
import { JsonValue, Spark, ExecResult, isMemoryOK } from '@shared/utils';

@Injectable()
export class BatchRepo implements IBatchRepo {
  constructor(
    @Inject('IWasmRepo') private readonly wasmRepo: IWasmRepo,
    private readonly batchMapper: BatchMapper,
    private readonly appConfig: AppConfig,
    private readonly socketService: SocketService,
  ) {}

  async executeSync(versionId: string, dto: ExecuteWasmDto): Promise<BatchData> {
    const wasm = await this.wasmRepo.findWasm(versionId);

    const inputs = Array.isArray(dto.inputs) ? dto.inputs : [dto.inputs];
    const results: ExecResult[] = [];

    for (const i of inputs) {
      const input = Spark.buildRequest(i, versionId);
      const start = performance.now();
      const output = await wasm.execute(input);
      const end = performance.now();
      results.push({ input, output, elapsed: end - start });
    }

    this.wasmRepo.saveHistory(versionId, results);

    return BatchData.from(results);
  }

  async create(versionId: string, clientId: string, bufferSize = 0, totalRecords = 0): Promise<Batch> {
    const { health } = this.appConfig.props;
    if (!isMemoryOK(health.memoryThreshold)) throw new RateLimitExceeded('rss/heap memory limit exceeded');
    if (!this.canCreateBatch(versionId)) throw new RateLimitExceeded(`batch limit exceeded (${health.batchLimit})`);
    await this.wasmRepo.findWasm(versionId);

    try {
      const batch = Batch.created(versionId, clientId, bufferSize, totalRecords);
      const path = join(this.appConfig.props.app.uploadPath, `${versionId}_batch.csv`);
      const model = this.batchMapper.toModel(batch);

      if (!existsSync(path)) appendFileSync(path, `${BatchModelHandler.headers()}`);
      appendFileSync(path, `\n${model.toCsv()}`);
      return batch;
    } catch (cause) {
      throw new BatchSubmissionNotSaved(versionId, cause);
    }
  }

  async executeAsync(batch: Batch, records: JsonValue[]) {
    const wasm = await this.wasmRepo.findWasm(batch.service_id);
    const requests = records.map((record) => Spark.buildRequest(record, batch.service_id));

    this.updateCsvBatch(Batch.updated(batch));

    const start = performance.now();
    let totalProcessed = 0;
    let updated: Batch;

    await wasm.executeAll(requests, (processed) => {
      try {
        totalProcessed += processed.length;
        const duration = performance.now() - start;
        const status = totalProcessed === requests.length ? 'completed' : 'processing';
        updated = Batch.updated(batch, status, totalProcessed, totalProcessed, duration);

        this.socketService.emit(`batch:${status}`, updated);
        this.updateCsvBatch(updated);
        this.saveBatchExec(batch.id, processed);

        Logger.log(updated.toString());
      } catch (cause) {
        const exception = new BatchExecNotSaved(batch.id, cause);
        Logger.warn(exception.getResponse());
      }
    });

    requests.length = 0;
    return updated;
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

  private canCreateBatch(versionId: string): boolean {
    const dataPath = join(this.appConfig.props.app.uploadPath, `${versionId}_batch.csv`);
    const processing = this.loadCsvBatch(dataPath)
      .map((m) => m.toBatch())
      .filter((b) => b.status === 'processing');

    return processing.length <= this.appConfig.props.health.batchLimit;
  }
}
