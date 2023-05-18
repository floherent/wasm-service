import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { HealthModule } from '@app/v1/modules/health/health.module';

@Module({
  imports: [HealthModule, HttpModule],
})
export class AppModule {}
