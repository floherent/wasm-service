import { Logger } from '@nestjs/common';
import { WasmRunner, ColumnarSerializer } from '@coherentglobal/wasm-runner';

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
  private readonly runners: WasmRunner[];

  get threads(): number {
    return this.runners.length;
  }

  private constructor(model: Model, replicas: number) {
    this.replicas = replicas;
    this.model = model;
    this.runners = [];
  }

  static async create(model: Model, options?: SparkOptions) {
    const replicas = options?.replicas ?? 1;
    const initialThreads = options?.threads ?? 1;
    const spark = new this(model, replicas);

    try {
      // Create multiple WasmRunner instances for parallel processing
      for (let i = 0; i < initialThreads; i++) {
        const runner = new WasmRunner(model);
        await runner.initialize();
        spark.runners.push(runner);
      }
    } catch (error) {
      if (spark.threads > 0 && spark.threads < initialThreads) {
        Logger.warn(`could only create ${spark.threads} runners for <${model.id}>`, 'Spark');
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

  static buildRequest(dataInputs: JsonValue, metadata: Record<string, any>, sharedData?: JsonValue): ExecRequestData {
    const shared = isNonNullObject(sharedData) ? { ...(sharedData as object) } : {};
    const inputs = shared ? { ...(dataInputs as object), ...shared } : dataInputs;
    return { request_data: { inputs }, request_meta: { ...metadata } };
  }

  async execute(data: ExecRequestData) {
    try {
      // Use the first runner for single execution
      const result = await this.runners[0].execute(data, this.model.id);
      return new ExecData(
        {
          outputs: result?.response_data?.outputs ?? {},
          errors: result?.response_data?.errors ?? [],
          warnings: result?.response_data?.warnings ?? [],
          service_chain: result?.response_data?.service_chain ?? [],
        },
        result.response_meta,
      );
    } catch (errors) {
      return new ExecData(
        { outputs: null, errors, warnings: [], service_chain: [] },
        { version_id: this.model.id, compiler_type: 'Neuron', process_time: 0 },
      );
    }
  }

  async executeAll(data: ExecRequestData[], predicate?: (processed: ExecResult[]) => void) {
    const results: ExecResult[] = [];
    const batchSize = Math.ceil(data.length / this.threads);

    // Process batches in parallel using the runners
    const batchPromises = [];
    for (let i = 0; i < this.threads; i++) {
      const batch = data.slice(i * batchSize, (i + 1) * batchSize);
      const runner = this.runners[i % this.runners.length];

      const batchPromise = Promise.all(
        batch.map(async (record) => {
          const start = performance.now();
          try {
            const output = await runner.execute(record, this.model.id);
            return { input: record, output, elapsed: performance.now() - start };
          } catch (error) {
            return { input: record, output: error ?? {}, elapsed: performance.now() - start };
          }
        }),
      );

      batchPromises.push(batchPromise);
    }

    // Wait for all batches to complete
    const batchResults = await Promise.all(batchPromises);

    // Flatten the results
    for (const batchResult of batchResults) {
      results.push(...batchResult);
      predicate?.(batchResult);
    }

    return results;
  }

  async dispose() {
    // Clean up all runners
    for (const runner of this.runners) {
      await runner.remove(this.model.id);
    }
    this.runners.length = 0;
  }
}
