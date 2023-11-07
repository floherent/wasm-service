import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { createWriteStream, statSync } from 'fs';
import { join } from 'path';

import { AppConfig } from '@app/modules/config';
import { Spark, ExternalWasm } from '@shared/utils';
import { ONE_KB } from '@shared/constants';
import { BadUploadWasmData } from '@shared/errors';

@Injectable()
export class WasmService {
  private readonly logger = new Logger(WasmService.name);
  private readonly bucket: string[] = [];
  private readonly wasms: Map<string, Spark> = new Map(); // could use redis or something else.

  constructor(private readonly appConfig: AppConfig, private readonly httpService: HttpService) {}

  getWasm(versionId: string): Spark | undefined {
    const wasm = this.wasms.get(versionId);
    if (!wasm) this.logger.warn(`no wasm found for version_id <${versionId}> in cache`);
    return wasm;
  }

  async setWasm(versionId: string, filePath: string) {
    if (this.wasms.size >= this.appConfig.props.spark.cacheSize) {
      const oldest = this.bucket.pop();
      if (oldest) {
        const wasm = this.wasms.get(oldest);
        if (wasm) await wasm.dispose();
        this.wasms.delete(oldest);
        this.logger.log(`wasm <${oldest}> has been removed from cache`);
      }
    }

    const wasm = await this.sparkify(versionId, filePath);
    this.wasms.set(versionId, wasm);
    this.bucket.unshift(versionId);
    this.logger.log(`wasm <${versionId}> has been cached`);
    return wasm;
  }

  remove(versionId: string) {
    const wasm = this.wasms.get(versionId);
    if (!wasm) return;

    wasm.dispose();
    this.wasms.delete(versionId);
    this.bucket.splice(this.bucket.indexOf(versionId), 1);
    this.logger.log(`wasm <${versionId}> has been removed from cache`);
  }

  async clear() {
    for (const wasm of this.wasms.values()) {
      await wasm.dispose();
    }
    this.wasms.clear();
    this.bucket.splice(0, this.bucket.length);
    this.logger.log('wasm cache has been cleared');
  }

  async download(url: string, versionId: string): Promise<ExternalWasm> {
    const filename = `${versionId}.zip`;
    const basePath = join(this.appConfig.props.app.uploadPath, filename);
    const filePath = join(process.cwd(), basePath);
    const writer = createWriteStream(filePath);

    try {
      const response = await this.httpService.axiosRef.get(url, { responseType: 'stream' });
      response.data.pipe(writer);
    } catch (error) {
      this.logger.error(`failed to download external wasm <${versionId}> from ${url}`);
      throw new BadUploadWasmData(`cannot download wasm from ${url}`, error);
    }

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        const stats = statSync(filePath);
        const size = stats.isFile() ? stats.size : 0;

        this.logger.log(`external wasm of size ${Math.round(size / ONE_KB)}KB downloaded from ${url}`);
        resolve({ filename, url, path: basePath, size });
      });

      writer.on('error', (reason) => {
        this.logger.error(`failed to write external wasm <${versionId}> onto disk`);

        writer.close();
        reject(reason);
      });
    });
  }

  private async sparkify(versionId: string, path: string) {
    this.logger.log(`initiating a new Spark instance for wasm <${versionId}>`);
    const filePath = join(process.cwd(), path);
    return await Spark.create({ id: versionId, url: filePath }, this.appConfig.props.spark);
  }
}
