import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOkResponse } from '@nestjs/swagger';

import { AppConfig } from '@app/modules/config';

@ApiTags('config')
@Controller({ path: 'config', version: '1' })
export class ConfigController {
  constructor(private readonly appConfig: AppConfig) {}

  @ApiOkResponse({ type: AppConfig, description: 'the current configuration of the wasm-service' })
  @Get()
  findOne() {
    const { app, spark, health } = this.appConfig.props;
    return {
      app: {
        name: app.name,
        description: app.description,
        port: app.port,
        context_path: app.contextPath,
        upload_path: app.uploadPath,
        data_path: app.dataPath,
      },
      spark: {
        cache_size: spark.cacheSize,
        threads: spark.threads,
        replicas: spark.replicas,
      },
      health: {
        batch_limit: health.batchLimit,
        indicators: {
          disk: health.diskThresholdPercent,
          wasm: health.wasmThreshold,
          memory: health.memoryThreshold,
        },
      },
    };
  }
}
