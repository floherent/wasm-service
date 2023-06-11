import { Module } from '@nestjs/common';

import { AppConfig } from '@app/modules/config/app.config';

@Module({
  providers: [{ provide: AppConfig, useFactory: () => AppConfig.getInstance() }],
  exports: [AppConfig],
})
export class AppConfigModule {}
