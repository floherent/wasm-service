import { Module } from '@nestjs/common';

import { AppConfig } from '@app/modules/config/app.config';
import { ConfigController } from './config.controller';

@Module({
  controllers: [ConfigController],
  providers: [{ provide: AppConfig, useFactory: () => AppConfig.getInstance() }],
  exports: [AppConfig],
})
export class AppConfigModule {}
