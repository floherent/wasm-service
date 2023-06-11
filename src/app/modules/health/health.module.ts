import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { AppConfigModule } from '@app/modules/config';
import { HealthController } from './health.controller';
import { WasmHealthIndicator } from './wasm-data.health';

@Module({
  imports: [TerminusModule, AppConfigModule],
  controllers: [HealthController],
  providers: [WasmHealthIndicator],
})
export class HealthModule {}
