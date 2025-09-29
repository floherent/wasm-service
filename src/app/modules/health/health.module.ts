import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { AppConfigModule } from '@app/modules/config';
import { HealthController } from './health.controller';
import { WasmDataHealthIndicator } from './wasm-data.health';
import { SaasServiceHealthIndicator } from './saas-service.health';

@Module({
  imports: [TerminusModule, AppConfigModule],
  controllers: [HealthController],
  providers: [WasmDataHealthIndicator, SaasServiceHealthIndicator],
})
export class HealthModule {}
