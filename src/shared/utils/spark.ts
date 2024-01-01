import { Logger } from '@nestjs/common';
import { WasmRunner, ColumnarSerializer } from '@coherentglobal/wasm-runner';
import { Worker } from 'worker_threads';
import { join } from 'path';

import { ExecData } from '@domain/wasm';
import { ExecRequestData, ExecResult, JsonValue } from './types';
import { WasmRunnerNotCreated } from '../errors';
import { isNonNullObject } from './decorators';

export interface SparkOptions {
  replicas?: number;
  threads?: number;
}

export interface Model {
  /** version_id (uuid) */
  id: string;
  /**  absolute path to wasm file */
  url: string;
}

/**
 * A wrapper around `WasmRunner` that executes a model.
 *
 * @param {Model} model info to be executed. The provided `url` can be a local
 * path, a remote URL, or even a file buffer. Ideally, an absolute path will
 * perform much better.
 * @param {SparkOptions} options helps configure performance aspects of its runtime.
 * @throws {WasmRunnerNotCreated} if the runner fails to initialize.
 *
 * Additionally, this wrapper can execute multiple records in parallel.
 *
 * Suppose we have 100 records of input data to execute. With 4 threads or workers
 * in place, it will divide the input data into 4 batches of 25 records each. Each
 * worker will then execute its batch of records in parallel. Note that each
 * worker will have its own instance of `WasmRunner` to execute the model. If
 * `replicas` is set to 2, then each worker will have 2 instances of `WasmRunner`
 * to execute the model asynchronously.
 */
export class Spark {
  private static readonly serializer = new ColumnarSerializer();

  private readonly replicas: number;
  private readonly model: Model;
  private readonly workers: Worker[];
  private readonly runner: WasmRunner;

  get threads(): number {
    return this.workers.length;
  }

  private constructor(model: Model, replicas: number) {
    this.replicas = replicas;
    this.model = model;
    this.workers = [];
    this.runner = new WasmRunner(model);
  }

  static async create(model: Model, options?: SparkOptions) {
    const replicas = options?.replicas ?? 1;
    const initialThreads = options?.threads ?? 1;
    const spark = new this(model, replicas);

    try {
      await spark.runner.initialize();

      for (let i = 0; i < initialThreads; i++) {
        const worker = new Worker(join(__dirname, 'runner.js'));
        spark.workers.push(worker);
      }
    } catch (error) {
      if (spark.threads > 0 && spark.threads < initialThreads) {
        Logger.warn(`could only create ${spark.threads} workers for <${model.id}>`, 'Spark');
      } else {
        throw new WasmRunnerNotCreated(`failed to create wasm runner for <${model.id}>`, error);
      }
    }

    return spark;
  }

  static inferFormatFrom(inputs: JsonValue, shared?: JsonValue): ['columnar' | 'json', JsonValue, JsonValue?] {
    const format = ColumnarSerializer.isDeserializable(inputs) ? 'columnar' : 'json';
    const data = format === 'columnar' ? this.serializer.deserialize(inputs) : inputs;
    const common = format === 'columnar' ? this.serializer.deserialize(shared) : shared;
    return [format, data, common];
  }

  static buildRequest(dataInputs: JsonValue, versionId: string, sharedData?: JsonValue): ExecRequestData {
    const shared = isNonNullObject(sharedData) ? { ...(sharedData as object) } : {};
    const inputs = shared ? { ...(dataInputs as object), ...shared } : dataInputs;
    return { request_data: { inputs }, request_meta: { version_id: versionId } };
  }

  async execute(data: ExecRequestData) {
    return (await this.runner.execute(data, this.model.id)) as ExecData;
  }

  async executeAll(data: ExecRequestData[], predicate?: (processed: ExecResult[]) => void) {
    const handlers: Promise<ExecResult[]>[] = [];
    const batchSize = Math.ceil(data.length / this.threads);

    for (let i = 0; i < this.threads; i++) {
      const batch = data.slice(i * batchSize, (i + 1) * batchSize);
      const handler = new Promise<ExecResult[]>((resolve) => {
        this.workers[i].once('message', (data) => {
          predicate?.(data);
          resolve(data);
        });
        this.workers[i].postMessage({ replicas: this.replicas, model: this.model, records: batch });
      });
      handlers.push(handler);
    }

    return Promise.all(handlers).then((all) => all.flat());
  }

  async dispose() {
    await this.runner.remove(this.model.id);
    for (const worker of this.workers) {
      worker.terminate();
    }
    this.workers.length = 0;
  }
}
