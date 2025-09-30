import { Module } from '@nestjs/common';

import { SaasService } from '@app/common';
import { AppConfig } from '@app/modules/config/app.config';
import { ConfigController } from './config.controller';

@Module({
  controllers: [ConfigController],
  providers: [{ provide: AppConfig, useFactory: () => AppConfig.getInstance() }, SaasService],
  exports: [AppConfig, SaasService],
})
export class AppConfigModule {}
