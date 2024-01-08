import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';

import { AppConfig } from '@app/modules/config';
import { getFolderSize } from '@shared/utils';

@Injectable()
export class WasmDataHealthIndicator extends HealthIndicator {
  constructor(private readonly appConfig: AppConfig) {
    super();
  }

  async checkSize(key: string, wasmDataThreshold: number): Promise<HealthIndicatorResult> {
    const folderSize = getFolderSize(this.appConfig.props.app.uploadPath);
    const isHealthy = folderSize.mb < wasmDataThreshold;
    const status = this.getStatus(key, isHealthy, { size: folderSize.bytes });

    if (isHealthy) return status;
    throw new HealthCheckError('too many WASM files; consider deleting unneeded ones!', status);
  }
}
