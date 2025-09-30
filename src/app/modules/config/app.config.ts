import { Logger } from '@nestjs/common';
import { readFileSync as read, existsSync } from 'fs';
import { Config as SaasConfig, SparkError } from '@cspark/sdk';
import { resolve } from 'path';
import * as yaml from 'js-yaml';

const configPath: string = process.env['WS_CONFIG_PATH'] ?? '.config/default.yml';

interface Config {
  app: {
    name: string;
    description: string;
    version: string;
    port: number;
    contextPath: string;
    uploadPath: string;
    bodyLimit: string | number;
  };
  spark: {
    cacheSize: number;
    threads: number;
    replicas: number;
  };
  health: {
    appDir: string;
    wasmThreshold: number;
    diskThresholdPercent: number;
    memoryThreshold: number;
  };
  connectivity?: {
    enabled: boolean;
    baseUrl: string;
    token?: { header: string; value: string };
    apiKey?: { header: string; value: string };
    oauth2?: { clientId: string; clientSecret: string };
  };
  history: {
    enabled: boolean;
  };
}

class AppConfig {
  private static _instance: AppConfig;
  private readonly _config: Config;
  private readonly logger = new Logger(AppConfig.name);

  get props(): Config {
    return this._config;
  }

  private constructor() {
    if (!existsSync(configPath)) {
      this.logger.warn(`Config file not found at ${configPath}`);
      this._config = DEFAULT_CONFIG;
      return;
    }
    this.logger.log(`Loading config from ${configPath}`);

    const config = yaml.load(read(configPath, 'utf-8')) as Record<string, any>;
    const service = config?.service;
    const performance = config?.performance;
    const indicators = performance?.health?.indicators;
    const connectivity = service?.connectivity;
    this._config = {
      app: {
        name: config?.name ?? DEFAULT_CONFIG.app.name,
        description: config?.description ?? DEFAULT_CONFIG.app.description,
        version: DEFAULT_CONFIG.app.version,
        port: parseInt(service?.port ?? DEFAULT_CONFIG.app.port, 10),
        contextPath: service?.contextPath ?? DEFAULT_CONFIG.app.contextPath,
        uploadPath: service?.uploadPath ?? DEFAULT_CONFIG.app.uploadPath,
        bodyLimit: service?.bodyLimit ?? DEFAULT_CONFIG.app.bodyLimit,
      },
      spark: {
        cacheSize: parseInt(performance?.spark?.cacheSize ?? DEFAULT_CONFIG.spark.cacheSize, 10),
        threads: parseInt(performance?.spark?.threads ?? DEFAULT_CONFIG.spark.threads, 10),
        replicas: parseInt(performance?.spark?.replicas ?? DEFAULT_CONFIG.spark.replicas, 10),
      },
      health: {
        appDir: resolve(performance?.health?.appDir ?? DEFAULT_CONFIG.health.appDir),
        diskThresholdPercent: parseFloat(indicators?.disk ?? DEFAULT_CONFIG.health.diskThresholdPercent),
        wasmThreshold: parseInt(indicators?.wasm ?? DEFAULT_CONFIG.health.wasmThreshold, 10),
        memoryThreshold: parseInt(indicators?.memory ?? DEFAULT_CONFIG.health.memoryThreshold, 10),
      },
      connectivity: {
        enabled: connectivity?.enabled ?? false,
        baseUrl: connectivity?.baseUrl ?? '', // will throw an error if not set.
        token: connectivity?.token ? { ...connectivity.token } : undefined,
        apiKey: connectivity?.apiKey ? { ...connectivity.apiKey } : undefined,
        oauth2: connectivity?.oauth2 ? { ...connectivity.oauth2 } : undefined,
      },
      history: {
        enabled: performance?.history?.enabled ?? DEFAULT_CONFIG.history.enabled,
      },
    };
  }

  static getInstance(): AppConfig {
    return this._instance ?? (this._instance = new AppConfig());
  }

  printUsage(verbose = false): void {
    const { app } = this._config;
    const description = app.description ? `(${app.description})` : '';
    Logger.log(`${app.name} ${description} running on port ${app.port}...`);
    this.printConnectivity(verbose);
    if (verbose) this.printVerbose();
  }

  printVerbose(): void {
    this.logger.log(`Printing app config: \n${JSON.stringify(this._config, null, 2)}`);
  }

  printConnectivity(verbose = false): void {
    const { connectivity } = this._config;
    if (!connectivity.enabled) return;

    try {
      const { baseUrl, token, apiKey, oauth2: oauth } = connectivity;
      const config = new SaasConfig({ baseUrl, token: token?.value, apiKey: apiKey?.value, oauth, logger: false });
      this.logger.log(`Spark connectivity enabled using ${config.baseUrl} (${config.auth.type})`);
    } catch (error) {
      this.logger.warn(`Spark connectivity has been enabled but wrongly configured (${error.message})`);
      if (verbose && error instanceof SparkError) this.logger.warn(error.details);
    }
  }
}

const DEFAULT_CONFIG: Config = {
  app: {
    name: 'wasm-service',
    description: 'API service for running WASM files',
    version: '1.0',
    port: 8080,
    contextPath: '/',
    uploadPath: 'uploads',
    bodyLimit: '50mb',
  },
  spark: {
    cacheSize: 8,
    threads: 1,
    replicas: 1,
  },
  health: {
    appDir: '.',
    diskThresholdPercent: 0.75, // 75%
    wasmThreshold: 512, // 512MB
    memoryThreshold: 1024, // 1GB
  },
  history: {
    enabled: false,
  },
} as const;

/**
 * Loads the configuration from the environment variables.
 * @returns {Config} the app config
 */
const loadConfig = (): Config => AppConfig.getInstance().props;

export { AppConfig, Config, loadConfig, DEFAULT_CONFIG, configPath as CONFIG_PATH };
