import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

import { HealthModule } from '@app/v1/modules/health/health.module';
import { loadConfig, AppConfig } from './app.config';

@Module({
  imports: [HealthModule, HttpModule, ConfigModule.forRoot({ isGlobal: true, cache: false, load: [loadConfig] })],
  providers: [
    {
      provide: AppConfig,
      useFactory: (): AppConfig => AppConfig.getInstance(),
    },
  ],
})
export class AppModule {}
