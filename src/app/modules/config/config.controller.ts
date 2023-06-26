import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOkResponse } from '@nestjs/swagger';

import { AppConfig } from '@app/modules/config';

@ApiTags('config')
@Controller({ path: 'config', version: '1' })
export class ConfigController {
  constructor(private readonly appConfig: AppConfig) {}

  @ApiOkResponse({ type: AppConfig, description: 'the current configuration of the wasm-service' })
  @Get()
  findOne() {
    return this.appConfig.props;
  }
}
