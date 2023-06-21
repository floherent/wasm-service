import { Controller, Get } from '@nestjs/common';

import { AppConfig } from '@app/modules/config';

@Controller({ path: 'config', version: '1' })
export class ConfigController {
  constructor(private readonly appConfig: AppConfig) {}

  @Get()
  findOne() {
    return this.appConfig.props;
  }
}
