import { WasmRunner } from '@coherentglobal/wasm-runner';

import { ExecData } from '@domain/wasm';
import { ExecRequestData, JsonValue } from './types';

export interface SparkOptions {
  replicas?: number;
  threads?: number;
}

/**
 * A wrapper around `WasmRunner` that allows for multiple replicas of the same
 * model to be executed in parallel.
 *
 * Suppose we have 100 records of input data to execute. For a model with 4
 * replicas, the operation will now be divided into 4 batches of 25 records each.
 *
 * @param {Model} model info to be executed. The provided `url` can be a local
 * path, a remote URL, or even a file buffer. Ideally, an absolute path will
 * perform much better.
 * @param {SparkOptions} options helps configure performance aspects of its runtime.
 *
 * **IMPORTANT**: This implementation is not thread-safe. It actually lets the
 * `WasmRunner` handle multithreading. It's recommended to use horizontal scaling
 * to achieve better performance.
 */
export class Spark {
  private readonly model: Model & { size: number };
  private readonly runners: WasmRunner[] = [];
  private readonly threads: number;

  get replicas(): number {
    return this.runners.length;
  }

  get threadsPerReplica(): number {
    return this.threads;
  }

  private constructor(model: Model, options?: SparkOptions) {
    this.threads = options?.threads ?? 1;
    this.model = { ...model, size: this.threads };
  }

  static async create(model: Model, options?: SparkOptions) {
    const spark = new this(model, options);
    for await (const runner of spark.init(options?.replicas ?? 1)) {
      spark.runners.push(runner);
    }
    return spark;
  }

  async dispose() {
    for (const runner of this.runners) {
      await runner.remove(this.model.id);
    }
    this.runners.splice(0, this.replicas);
  }

  async execute(data: ExecRequestData, position?: number) {
    const index = position ?? Math.floor(Math.random() * this.replicas);
    return (await this.runners[index].execute(data, this.model.id)) as ExecData;
  }

  async executeAll(data: ExecRequestData[]) {
    const results: ExecData[] = [];
    for await (const batch of this.executeAsync(data)) {
      results.push(...batch);
    }
    return results;
  }

  async increaseBy(unit = 1) {
    for await (const runner of this.init(unit)) {
      this.runners.push(runner);
    }
  }

  async decreaseBy(unit = 1) {
    for (let i = 0; i < unit; i++) {
      const runner = this.runners.pop();
      if (!runner) break;
      await runner.remove(this.model.id);
    }
  }

  private async *init(unit: number) {
    for (let i = 0; i < unit; i++) {
      const runner = new WasmRunner(this.model);
      await runner.initialize();
      yield runner;
    }
  }

  private async *executeAsync(data: ExecRequestData[]) {
    const units = this.replicas;
    const size = Math.ceil(data.length / units);
    const batches = Array.from({ length: size }, (_, i) => data.slice(i * units, (i + 1) * units));

    for (const batch of batches) {
      const handlers = batch.map((b, i) => this.runners[i].execute(b, this.model.id));
      const all = await Promise.all(handlers);
      yield all.flat() as ExecData[];
    }
  }
}

interface Model {
  id: string; // version_id
  url: string; // absolute path to wasm file
}

/**
 * Builds the request data to be sent to the model.
 *
 * @param {string} versionId of the model to be executed
 * @param {object} inputs data to be executed
 * @returns {ExecRequestData} expected to run the model.
 */
export const buildRequest = (versionId: string, inputs: JsonValue): ExecRequestData => {
  return {
    request_data: { inputs },
    request_meta: {
      version_id: versionId,
      call_purpose: 'Offline Execution',
      source_system: 'wasm-service',
    },
  } as ExecRequestData;
};
