import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

import { AppConfig } from '@app/modules/config';
import { ONE_KB, ONE_MB } from '@shared/constants';

@Injectable()
export class WasmHealthIndicator extends HealthIndicator {
  private readonly WASM_DATA_THRESHOLD_IN_MB: number; // 150 MB

  constructor(private readonly appConfig: AppConfig) {
    super();
    this.WASM_DATA_THRESHOLD_IN_MB = this.appConfig.props.health.wasmThreshold * ONE_MB;
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const folderSize = this.getFolderSize(this.appConfig.props.app.uploadPath);
    const isHealthy = folderSize.mb < this.WASM_DATA_THRESHOLD_IN_MB;
    const status = this.getStatus(key, isHealthy, { sizeInMB: +folderSize.mb.toFixed(3) });

    if (isHealthy) return status;
    throw new HealthCheckError('Too many WASM files. Consider deleting unneeded ones.', status);
  }

  getFolderSize(folderPath: string) {
    let totalSize = 0;

    const calculateSize = (filePath: string): void => {
      const stats = statSync(filePath);

      if (stats.isDirectory()) {
        const files = readdirSync(filePath);
        files.forEach((file) => {
          const nestedFilePath = join(filePath, file);
          calculateSize(nestedFilePath);
        });
      } else if (stats.isFile()) {
        totalSize += stats.size;
      }
    };

    calculateSize(folderPath);

    // Convert size to human-readable format
    const inBytes = totalSize;
    const inKilobytes = inBytes / ONE_KB;
    const inMegabytes = inKilobytes / ONE_KB;
    const inGigabytes = inMegabytes / ONE_KB;

    return {
      bytes: inBytes,
      kb: inKilobytes,
      mb: inMegabytes,
      gb: inGigabytes,
    };
  }
}
