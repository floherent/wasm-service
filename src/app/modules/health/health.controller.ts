import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { HealthCheck, HealthCheckService, DiskHealthIndicator, MemoryHealthIndicator } from '@nestjs/terminus';
import { ApiTags } from '@nestjs/swagger';

import { AppConfig } from '@app/modules/config';
import { ONE_MB } from '@shared/constants';
import { getMemoryUsage } from '@shared/utils';
import { HealthProfile } from '@shared/docs';
import { WasmDataHealthIndicator } from './wasm-data.health';
import { SaasServiceHealthIndicator } from './saas-service.health';

@ApiTags('health')
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  private readonly PLATFORM_PATH: string;
  private readonly DISK_THRESHOLD_PERCENT: number;
  private readonly MEMORY_THRESHOLD_IN_MB: number;
  private readonly WASM_DATA_THRESHOLD_IN_MB: number;

  constructor(
    private readonly health: HealthCheckService,
    private readonly disk: DiskHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly wasm: WasmDataHealthIndicator,
    private readonly saas: SaasServiceHealthIndicator,
    private readonly appConfig: AppConfig,
  ) {
    this.PLATFORM_PATH = this.appConfig.props.health.appDir;
    this.DISK_THRESHOLD_PERCENT = this.appConfig.props.health.diskThresholdPercent;
    this.MEMORY_THRESHOLD_IN_MB = this.appConfig.props.health.memoryThreshold * ONE_MB;
    this.WASM_DATA_THRESHOLD_IN_MB = this.appConfig.props.health.wasmThreshold * ONE_MB;
  }

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // The used disk storage for wasm should not exceed this threshold.
      () => this.wasm.checkSize('wasm_data', this.WASM_DATA_THRESHOLD_IN_MB),

      // The used disk storage should not exceed 75% of the full disk size.
      () =>
        this.disk.checkStorage('disk_storage', {
          thresholdPercent: this.DISK_THRESHOLD_PERCENT,
          path: this.PLATFORM_PATH,
        }),

      // The used memory heap and RSS/RAM should not exceed this threshold.
      () => this.memory.checkHeap('memory_heap', this.MEMORY_THRESHOLD_IN_MB),
      () => this.memory.checkRSS('memory_rss', this.MEMORY_THRESHOLD_IN_MB),

      // This app should be able to establish connectivity with the SaaS service (when enabled)
      () => this.saas.healthCheck('connectivity'),
    ]);
  }

  @Get('profile')
  @HealthProfile()
  getProfile() {
    const { health } = this.appConfig.props;
    const { rss, heapTotal, heapUsed } = getMemoryUsage();
    return {
      rss: Math.round(rss / ONE_MB),
      heap_total: Math.round(heapTotal / ONE_MB),
      heap_used: Math.round(heapUsed / ONE_MB),
      threshold: {
        disk: health.diskThresholdPercent,
        wasm: health.wasmThreshold,
        memory: health.memoryThreshold,
      },
    };
  }
}
