import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

import { HealthModule } from '@app/modules/health/health.module';
import { ServicesModule } from '@app/modules/services/services.module';
import { loadConfig } from '@app/modules/config';

@Module({
  imports: [
    HealthModule,
    HttpModule,
    ConfigModule.forRoot({ isGlobal: true, cache: false, load: [loadConfig] }),
    ServicesModule,
  ],
})
export class AppModule {}
