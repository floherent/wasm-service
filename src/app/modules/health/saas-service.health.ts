import { Injectable, Logger } from '@nestjs/common';
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';
import { SparkClient, SparkError } from '@cspark/sdk';

import { AppConfig } from '@app/modules/config';

@Injectable()
export class SaasServiceHealthIndicator {
  private readonly client: SparkClient | null;
  private readonly logger = new Logger(SaasServiceHealthIndicator.name);
  private readonly WARNING = 'Spark connectivity is disabled; health check is not possible';

  constructor(private readonly healthIndicatorService: HealthIndicatorService, private readonly appConfig: AppConfig) {
    const { connectivity } = this.appConfig.props;
    const { baseUrl, token, apiKey, oauth2: oauth } = connectivity;
    try {
      if (!connectivity.enabled) throw new Error(this.WARNING);
      this.client = new SparkClient({ baseUrl, token: token?.value, apiKey: apiKey?.value, oauth, logger: false });
    } catch (error) {
      this.client = null;
      this.logger.warn(error instanceof SparkError ? `SaaS configuration invalid (${error.message})` : error.message);
    }
  }

  async healthCheck(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);

    if (!this.client) {
      const isEnabled = this.appConfig.props.connectivity.enabled;
      this.logger.warn(!isEnabled ? this.WARNING : 'SaaS configuration invalid; check connectivity settings');

      return !isEnabled
        ? indicator.up({ warning: this.WARNING })
        : indicator.down({ warning: 'SaaS configuration invalid; check connectivity settings' });
    }

    const info = { baseUrl: this.client?.config.baseUrl.toString(), authType: this.client?.config.auth.type };
    try {
      const isOk = await this.client?.health.ok(); // FIXME: also check validity of auth settings.
      return !isOk ? indicator.down(info) : indicator.up(info);
    } catch (error) {
      return indicator.down({ ...info, error: error?.message });
    }
  }
}
