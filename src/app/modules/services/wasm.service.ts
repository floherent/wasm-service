import { Injectable, Logger } from '@nestjs/common';

import { AppConfig } from '@app/modules/config';
import { Spark } from '@shared/utils';

@Injectable()
export class WasmService {
  private readonly logger = new Logger(WasmService.name);
  private readonly bucket: string[] = [];

  readonly wasms: Map<string, Spark> = new Map(); // could use redis or something else.

  constructor(private readonly appConfig: AppConfig) {}

  getWasm(versionId: string): Spark | undefined {
    const wasm = this.wasms.get(versionId);
    if (!wasm) this.logger.log(`no wasm found for version_id: ${versionId}`);
    return wasm;
  }

  setWasm(versionId: string, filePath: string): Spark {
    if (this.wasms.size >= this.appConfig.props.app.cacheSize) {
      const oldest = this.bucket.pop();
      if (oldest) {
        this.wasms.delete(oldest);
        this.logger.log(`wasm (${oldest}) has been removed from cache`);
      }
    }

    if (this.wasms.has(versionId)) this.logger.warn(`wasm (${versionId}) already exists in cache`);

    const wasm = this.sparkify(versionId, filePath);
    this.wasms.set(versionId, wasm);
    this.bucket.unshift(versionId);
    this.logger.log(`wasm (${versionId}) has been cached`);
    return wasm;
  }

  private sparkify(versionId: string, filePath: string): Spark {
    // FIXME: caching one model per Spark instances at the moment.
    return new Spark({ id: versionId, url: filePath });
  }
}
