import { Injectable, Logger } from '@nestjs/common';
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';

import { AppConfig } from '@app/modules/config';
import { SaasService } from '@app/common';

@Injectable()
export class SaasServiceHealthIndicator {
  private readonly logger = new Logger(SaasServiceHealthIndicator.name);

  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly appConfig: AppConfig,
    private readonly saasService: SaasService,
  ) {}

  async healthCheck(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);

    if (!this.saasService.client) {
      const { enabled: isEnabled } = this.appConfig.props.connectivity;

      if (!isEnabled) {
        const warning = 'Spark connectivity is disabled; health check is not possible';
        this.logger.warn(warning);
        return indicator.up({ warning });
      }

      return indicator.down({ warning: 'SaaS configuration invalid; check connectivity settings' });
    }

    const info = {
      baseUrl: this.saasService.client.config.baseUrl.full,
      authType: this.saasService.client.config.auth.type,
    };
    try {
      const isOk = await this.saasService.client.health.ok();
      return !isOk ? indicator.down(info) : indicator.up(info);
    } catch (error) {
      return indicator.down({ ...info, error: error?.message });
    }
  }

  async authCheck(key: string): Promise<HealthIndicatorResult> {
    throw new Error(`Authorization check not implemented yet: ${key}`);
  }
}
