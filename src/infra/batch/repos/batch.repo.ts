import { Injectable, Inject, Logger } from '@nestjs/common';
import { readFile, writeFile, appendFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { parse as csvParse } from 'papaparse';
import { join } from 'path';

import { AppConfig } from '@app/modules/config';
import { SocketService } from '@app/modules/socket';
import { BatchModelHandler, BatchExecModelHandler, BatchModel } from '@infra/batch';
import { BatchExecModel, BatchMapper, BatchExecMapper } from '@infra/batch';
import { ExecuteWasmDto, IWasmRepo } from '@domain/wasm';
import { IBatchRepo, Batch, BatchData, BatchExec } from '@domain/batch';
import { BatchSubmissionNotSaved, BatchExecNotSaved, RecordsNotFound } from '@shared/errors';
import { BatchResultsNotFound, RateLimitExceeded } from '@shared/errors';
import { JsonValue, Spark, ExecResult, isMemoryOK } from '@shared/utils';

@Injectable()
export class BatchRepo implements IBatchRepo {
  constructor(
    @Inject('IWasmRepo') private readonly wasmRepo: IWasmRepo,
    private readonly batchMapper: BatchMapper,
    private readonly batchExecMapper: BatchExecMapper,
    private readonly appConfig: AppConfig,
    private readonly socketService: SocketService,
  ) {}

  async executeSync(versionId: string, dto: ExecuteWasmDto): Promise<BatchData> {
    const wasm = await this.wasmRepo.findWasm(versionId);

    const inputs = Array.isArray(dto.inputs) ? dto.inputs : [dto.inputs];
    const results: ExecResult[] = [];

    for (const i of inputs) {
      const metadata = { ...(dto.metadata ?? {}), version_id: versionId };
      const input = Spark.buildRequest(i, metadata, dto.shared);
      const start = performance.now();
      const output = await wasm.execute(input);
      const end = performance.now();
      results.push({ input, output, elapsed: end - start });
    }

    this.wasmRepo.saveHistory(versionId, results);

    return BatchData.from(results);
  }

  async create(serviceId: string, clientId: string, bufferSize = 0, totalRecords = 0): Promise<Batch> {
    const { health } = this.appConfig.props;
    if (!isMemoryOK(health.memoryThreshold)) throw new RateLimitExceeded('rss/heap memory limit exceeded');
    if (!this.canCreateBatch()) throw new RateLimitExceeded(`batch limit exceeded`);
    await this.wasmRepo.findWasm(serviceId);

    try {
      const batch = Batch.created(serviceId, clientId, bufferSize, totalRecords);
      const path = join(this.appConfig.props.app.uploadPath, BATCH_PATH);
      const model = this.batchMapper.toModel(batch);

      if (!existsSync(path)) await appendFile(path, `${BatchModelHandler.headers()}`);
      await appendFile(path, `\n${model.toCsv()}`);
      return batch;
    } catch (cause) {
      throw new BatchSubmissionNotSaved(serviceId, cause);
    }
  }

  async executeAsync(batch: Batch, records: JsonValue[], metadata: Record<string, any> = {}, shared?: JsonValue) {
    const wasm = await this.wasmRepo.findWasm(batch.service_id);
    const requests = records.map((record) =>
      Spark.buildRequest(record, { ...metadata, version_id: batch.service_id }, shared),
    );

    this.updateCsvBatch(Batch.updated(batch));

    const start = performance.now();
    return wasm
      .executeAll(requests)
      .then((processed) => {
        const duration = performance.now() - start;
        const completed = Batch.completed(batch, processed.length, processed.length, duration);

        this.socketService.emit(`batch:completed`, completed);
        this.updateCsvBatch(completed);
        this.saveBatchExec(batch.id, processed);

        Logger.log(completed.toString());
        return completed;
      })
      .catch((cause) => {
        const exception = new BatchExecNotSaved(batch.id, cause);
        Logger.warn(exception.getResponse());
        return batch;
      });
  }

  async findOne(batchId: string): Promise<Batch> {
    const dataPath = join(this.appConfig.props.app.uploadPath, BATCH_PATH);
    const data = await this.loadCsvBatch(dataPath);
    const model = data.find((m) => m.id === batchId);
    if (!model) throw new RecordsNotFound(batchId);

    return model.toBatch();
  }

  async getResult(batchId: string): Promise<BatchExec[]> {
    const path = join(this.appConfig.props.app.uploadPath, `b_${batchId}.csv`);
    if (!existsSync(path)) throw new BatchResultsNotFound(batchId);

    const parsed = csvParse<BatchExecModel>(await readFile(path, 'utf8'), { header: true, delimiter: '|' });
    if (parsed.errors.length > 0) return [];
    return this.batchExecMapper.reverseAll(parsed.data);
  }

  async downloadResult(batchId: string): Promise<Buffer> {
    const path = join(this.appConfig.props.app.uploadPath, `b_${batchId}.csv`);
    if (!existsSync(path)) throw new BatchResultsNotFound(batchId);

    return await readFile(path);
  }

  async deleteResults(batchIds: string[]): Promise<number> {
    let deleted = 0;
    const { uploadPath } = this.appConfig.props.app;
    const dataPath = join(uploadPath, BATCH_PATH);
    const data = (await this.loadCsvBatch(dataPath)).filter((m) => {
      if (m.status === 'processing' || m.status === 'created') {
        throw new RateLimitExceeded(`batch <${m.id}> is still processing`);
      }
      return !batchIds.includes(m.id);
    });

    for (const batchId of batchIds) {
      const batchFile = join(uploadPath, `b_${batchId}.csv`);
      console.log('deleting batch file', batchFile);
      if (!existsSync(batchFile)) continue;
      await unlink(batchFile);
      deleted++;
    }

    let updated = data.map((row) => row.toCsv()).join('\n');
    if (updated.trim().length > 0) updated = '\n' + updated;
    await writeFile(dataPath, `${BatchModelHandler.headers()}${updated}`);
    return deleted;
  }

  private async saveBatchExec(batchId: string, results: ExecResult[]): Promise<void> {
    try {
      const path = join(this.appConfig.props.app.uploadPath, `b_${batchId}.csv`);
      const models = results.map(
        (result) =>
          new BatchExecModelHandler({
            inputs: JSON.stringify(result.input.request_data.inputs),
            outputs: JSON.stringify(result.output.response_data.outputs),
            executed_at: Date.now().toString(),
            duration: result.elapsed.toFixed(2),
          }),
      );

      const content = BatchExecModelHandler.headers() + '\n' + models.map((m) => m.toCsv()).join('\n');
      await appendFile(path, content);
    } catch (cause) {
      throw new BatchExecNotSaved(batchId, cause);
    }
  }

  private async loadCsvBatch(filePath: string): Promise<BatchModelHandler[]> {
    const url = join(process.cwd(), filePath);
    if (!existsSync(url)) return [];

    const parsed = csvParse<BatchModel>(await readFile(url, 'utf8'), { header: true });
    if (parsed.errors.length > 0) return [];

    return parsed.data.map((row) => new BatchModelHandler({ ...row }));
  }

  private async updateCsvBatch(batch: Batch): Promise<void> {
    const dataPath = join(this.appConfig.props.app.uploadPath, BATCH_PATH);
    const data = await this.loadCsvBatch(dataPath);

    for (const i in data) {
      if (data[i].id === batch.id) {
        data[i] = this.batchMapper.toModel(batch);
        break;
      }
    }

    const updated = data.map((row) => row.toCsv()).join('\n');
    await writeFile(dataPath, `${BatchModelHandler.headers()}\n${updated}`);
  }

  private async canCreateBatch(): Promise<boolean> {
    const dataPath = join(this.appConfig.props.app.uploadPath, BATCH_PATH);
    const processing = (await this.loadCsvBatch(dataPath))
      .map((m) => m.toBatch())
      .filter((b) => b.status === 'processing');
    return processing.length < 1;
  }
}

const BATCH_PATH = 'batch-data.csv';
