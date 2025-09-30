import { Injectable, Logger } from '@nestjs/common';
import { SparkClient, SparkError } from '@cspark/sdk';

import { AppConfig } from '@app/modules/config';
import { SAAS_CONNECTION_TIMEOUT as timeout } from '@shared/constants';

@Injectable()
export class SaasService {
  private readonly logger = new Logger(SaasService.name);
  readonly client: SparkClient | null;

  constructor(private readonly appConfig: AppConfig) {
    const { connectivity } = this.appConfig.props;
    const { baseUrl, token, apiKey, oauth2: oauth } = connectivity;
    try {
      if (!connectivity.enabled) throw new Error('Spark connectivity is disabled; health check is not possible');
      const options = { baseUrl, token: token?.value, apiKey: apiKey?.value, oauth, logger: false, timeout };
      this.client = new SparkClient(options);
    } catch (error) {
      this.client = null;
      this.logger.warn(error instanceof SparkError ? `SaaS configuration invalid (${error.message})` : error.message);
    }
  }

  download = SparkClient.download;
}
