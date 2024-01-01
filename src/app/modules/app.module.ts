import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { HealthModule } from '@app/modules/health/health.module';
import { ServicesModule } from '@app/modules/services/services.module';
import { BatchModule } from '@app/modules/batch/batch.module';

@Module({ imports: [HealthModule, HttpModule, ServicesModule, BatchModule] })
export class AppModule {}
