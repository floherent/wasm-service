import { Logger } from '@nestjs/common';
import { readFileSync as read, existsSync } from 'fs';
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
    wasmThreshold: number;
    diskThresholdPercent: number;
    memoryThreshold: number;
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
    this._config = {
      app: {
        name: config?.name ?? DEFAULT_CONFIG.app.name,
        description: config?.description ?? DEFAULT_CONFIG.app.description,
        version: DEFAULT_CONFIG.app.version,
        port: parseInt(service?.port, 10) ?? DEFAULT_CONFIG.app.port,
        contextPath: service?.contextPath ?? DEFAULT_CONFIG.app.contextPath,
        uploadPath: service?.uploadPath ?? DEFAULT_CONFIG.app.uploadPath,
        bodyLimit: service?.bodyLimit ?? DEFAULT_CONFIG.app.bodyLimit,
      },
      spark: {
        cacheSize: parseInt(performance?.spark?.cacheSize, 10) ?? DEFAULT_CONFIG.spark.cacheSize,
        threads: parseInt(performance?.spark?.threads, 10) ?? DEFAULT_CONFIG.spark.threads,
        replicas: parseInt(performance?.spark?.replicas, 10) ?? DEFAULT_CONFIG.spark.replicas,
      },
      health: {
        diskThresholdPercent: parseFloat(indicators?.disk) ?? DEFAULT_CONFIG.health.diskThresholdPercent,
        wasmThreshold: parseInt(indicators?.wasm, 10) ?? DEFAULT_CONFIG.health.wasmThreshold,
        memoryThreshold: parseInt(indicators?.memory, 10) ?? DEFAULT_CONFIG.health.memoryThreshold,
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
    if (verbose) this.printVerbose();
  }

  printVerbose(): void {
    this.logger.log(`Printing app config: \n${JSON.stringify(this._config, null, 2)}`);
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
    diskThresholdPercent: 0.75, // 75%
    wasmThreshold: 512, // 512MB
    memoryThreshold: 1024, // 1GB
  },
} as const;

/**
 * Loads the configuration from the environment variables.
 * @returns {Config} the app config
 */
const loadConfig = (): Config => AppConfig.getInstance().props;

export { AppConfig, Config, loadConfig, DEFAULT_CONFIG, configPath as CONFIG_PATH };
