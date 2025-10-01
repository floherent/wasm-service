import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AppConfig } from '@app/modules/config';
import { GetAppConfig } from '@shared/docs';

@ApiTags('config')
@Controller({ path: 'config', version: '1' })
export class ConfigController {
  constructor(private readonly appConfig: AppConfig) {}

  @Get()
  @GetAppConfig()
  findOne() {
    const { app, spark, health, connectivity: conn, history } = this.appConfig.props;
    return {
      app: {
        name: app.name,
        description: app.description,
        port: app.port,
        context_path: app.contextPath,
        upload_path: app.uploadPath,
        body_limit: app.bodyLimit,
      },
      spark: {
        cache_size: spark.cacheSize,
        threads: spark.threads,
        replicas: spark.replicas,
      },
      health: {
        disk: health.diskThresholdPercent,
        wasm: health.wasmThreshold,
        memory: health.memoryThreshold,
      },
      connectivity: conn
        ? {
            enabled: conn.enabled,
            base_url: !conn.enabled ? undefined : conn.baseUrl,
            token: conn?.token ? { header: conn.token.header, value: '[secure]' } : undefined,
            api_key: conn?.apiKey ? { header: conn.apiKey.header, value: '[secure]' } : undefined,
            oauth2: conn?.oauth2 ? { client_id: '[secure]', client_secret: '[secure]' } : undefined,
          }
        : undefined,
      history,
    };
  }
}
