import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { AppConfigModule } from '@app/modules/config';
import { HealthController } from './health.controller';
import { WasmDataHealthIndicator } from './wasm-data.health';

@Module({
  imports: [TerminusModule, AppConfigModule],
  controllers: [HealthController],
  providers: [WasmDataHealthIndicator],
})
export class HealthModule {}
