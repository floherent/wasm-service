import { Injectable, Logger } from '@nestjs/common';
import { join } from 'path';

import { AppConfig } from '@app/modules/config';
import { Spark } from '@shared/utils';

@Injectable()
export class WasmService {
  private readonly logger = new Logger(WasmService.name);
  private readonly bucket: string[] = [];
  private readonly wasms: Map<string, Spark> = new Map(); // could use redis or something else.

  constructor(private readonly appConfig: AppConfig) {}

  getWasm(versionId: string): Spark | undefined {
    const wasm = this.wasms.get(versionId);
    if (!wasm) this.logger.log(`no wasm found for version_id <${versionId}>`);
    return wasm;
  }

  async setWasm(versionId: string, filePath: string) {
    if (this.wasms.size >= this.appConfig.props.spark.cacheSize) {
      const oldest = this.bucket.pop();
      if (oldest) {
        this.wasms.delete(oldest);
        this.logger.log(`wasm <${oldest}> has been removed from cache`);
      }
    }

    if (this.wasms.has(versionId)) this.logger.warn(`wasm <${versionId}> already exists in cache`);

    const wasm = await this.sparkify(versionId, filePath);
    this.wasms.set(versionId, wasm);
    this.bucket.unshift(versionId);
    this.logger.log(`wasm <${versionId}> has been cached`);
    return wasm;
  }

  remove(versionId: string) {
    const wasm = this.wasms.get(versionId);
    if (wasm) {
      this.wasms.delete(versionId);
      this.bucket.splice(this.bucket.indexOf(versionId), 1);
      this.logger.log(`wasm <${versionId}> has been removed from cache`);
    }
  }

  clear() {
    this.wasms.clear();
    this.bucket.splice(0, this.bucket.length);
    this.logger.log('wasm cache has been cleared');
  }

  private async sparkify(versionId: string, path: string) {
    this.logger.log(`initiating a new Spark instance for wasm <${versionId}>`);
    const filePath = join(process.cwd(), path);
    return await Spark.create({ id: versionId, url: filePath }, this.appConfig.props.spark);
  }
}
