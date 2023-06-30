import { WasmRunner } from '@coherentglobal/wasm-runner';
import { ExecRequestData, ExecResponseData } from './types';

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

  async execute(versionId: string, data: ExecRequestData) {
    const index = Math.floor(Math.random() * this.replicas); // so far no way to know which replica is busy.
    return (await this.runners[index].execute(data, versionId)) as ExecResponseData;
  }

  async executeAll(versionId: string, data: ExecRequestData[]) {
    const blockSize = Math.ceil(data.length / this.replicas); // 100 units / 4 replicas = 25 units per replica
    const blocks = [];

    for (let i = 0; i < this.replicas; i++) {
      blocks.push(data.slice(i * blockSize, (i + 1) * blockSize));
    }

    const handlers = this.runners.map((runner, i) => runner.execute(blocks[i], versionId));
    return await Promise.all(handlers);
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
}

interface Model {
  id: string; // version_id
  url: string; // absolute path to wasm file
}
