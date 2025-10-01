import { Injectable } from '@nestjs/common';
import { HealthIndicatorService, HealthIndicatorResult } from '@nestjs/terminus';

import { AppConfig } from '@app/modules/config';
import { getFolderSize, toFileSize } from '@shared/utils';

@Injectable()
export class WasmDataHealthIndicator {
  constructor(private readonly healthIndicatorService: HealthIndicatorService, private readonly appConfig: AppConfig) {}

  async checkSize(key: string, threshold: number): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    const folderSize = getFolderSize(this.appConfig.props.app.uploadPath);
    const inBytes = folderSize.bytes;
    const isHealthy = inBytes < threshold;
    const info = `${toFileSize(inBytes)} / ${toFileSize(threshold)} => ${Math.round((inBytes / threshold) * 100)}%`;

    if (isHealthy) {
      return indicator.up({
        size: inBytes,
        info: `currently using ${info.toLowerCase()}`,
      });
    }
    return indicator.down({
      size: inBytes,
      info: `too many WASM files; consider deleting unused ones (${info.toLowerCase()})`,
    });
  }
}
