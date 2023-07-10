import { Logger } from '@nestjs/common';
import { readFileSync as read } from 'fs';
import * as yaml from 'js-yaml';

const configPath: string = process.env['WS_CONFIG_PATH'] ?? '.config/config.yml';

class AppConfig {
  private static _instance: AppConfig;
  private readonly _config: Config;
  private readonly logger = new Logger(AppConfig.name);

  get props(): Config {
    return this._config;
  }

  private constructor() {
    this.logger.log(`Loading config from ${configPath}`);

    const config = yaml.load(read(configPath, 'utf-8')) as Record<string, any>;
    const service = config?.service;
    const performance = config?.performance;
    this._config = {
      app: {
        name: config?.name,
        description: config?.description,
        port: parseInt(service?.port, 10) ?? 8080,
        contextPath: service?.contextPath ?? '/',
        uploadPath: service?.uploadPath ?? './uploads',
        dataPath: service?.dataPath ?? './uploads/wasm-data.csv',
      },
      spark: {
        cacheSize: parseInt(performance?.spark?.cacheSize, 10) ?? 16,
        threads: parseInt(performance?.spark?.threads, 10) ?? 1,
        replicas: parseInt(performance?.spark?.replicas, 10) ?? 1,
      },
      health: {
        diskThresholdPercent: parseFloat(performance?.health?.indicators?.disk) ?? 0.75, // 75%
        wasmThreshold: parseInt(performance?.health?.indicators?.wasm, 10) ?? 150, // 150 MB
        memoryThreshold: parseInt(performance?.health?.indicators?.memory, 10) ?? 256, // 256 MB
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

/**
 * Loads the configuration from the environment variables.
 * @returns {Config} the app config
 */
export const loadConfig = (): Config => AppConfig.getInstance().props;

interface Config {
  app: {
    name: string;
    description: string;
    port: number;
    contextPath: string;
    uploadPath: string;
    dataPath: string;
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

export { AppConfig, Config };
