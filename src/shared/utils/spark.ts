import { WasmRunner } from '@coherentglobal/wasm-runner';
import { ExecRequestData } from './types';

export class Spark {
  private readonly runner: WasmRunner;
  private readonly models: Model[] = [];
  private _threads: number;

  set threads(value: number) {
    if (value <= 0) return;
    this._threads = value;
  }

  get length(): number {
    return this.models.length;
  }

  constructor(...models: Model[]) {
    this.models.concat(models);
    this.runner = models.length > 0 ? new WasmRunner(models) : new WasmRunner();
    this.runner.initialize();
    this._threads = 1;
  }

  add(model: Model, threads?: number) {
    if (this.models.findIndex((m) => m.id === model.id) >= 0) return;
    this.models.push(model);
    this.runner.append({ ...model, size: threads ?? this._threads });
  }

  remove(versionId: string) {
    const index = this.models.findIndex((model) => model.id === versionId);
    if (index <= -1) return;
    this.models.splice(index, 1);
    this.runner.remove(versionId);
  }

  has(versionId: string): boolean {
    return this.runner.isExist(versionId);
  }

  async execute(versionId: string, data: ExecRequestData) {
    return await this.runner.execute(data, versionId);
  }
}

interface Model {
  id: string; // version_id
  url: string; // absolute path to wasm file
}
