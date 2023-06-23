import { Logger } from '@nestjs/common';
import { readFileSync as read } from 'fs';
import * as yaml from 'js-yaml';

const configPath: string = process.env['CS_CONFIG_PATH'] ?? '.config/config.yml';
const contextPath = '/';
const uploadPath = './uploads';
const dataPath = './wasm-data.csv';
const servicePort = 8080;
const cacheSize = 10;
const wasmDataThreshold = 150; // 150 MB
const diskThresholdPercent = 0.75; // 512 MB
const memoryThreshold = 256; // 256 MB

interface Config {
  app: Partial<BaseConfig>;
  health: {
    wasmThreshold: number;
    diskThresholdPercent: number;
    memoryThreshold: number;
  };
}

interface BaseConfig {
  name: string;
  description: string;
  port: number;
  contextPath: string;
  uploadPath: string;
  dataPath: string;
  cacheSize: number;
}

class AppConfig {
  private static _instance: AppConfig;
  private readonly _config: Config;

  get props(): Config {
    return this._config;
  }

  private constructor() {
    Logger.log(`Loading config from ${configPath}`);

    const config = yaml.load(read(configPath, 'utf-8')) as Record<string, any>;
    const service = config?.service;
    const performance = config?.performance;
    this._config = {
      app: {
        name: config?.name,
        description: config?.description,
        port: parseInt(service?.port, 10) ?? servicePort,
        contextPath: service?.contextPath ?? contextPath,
        uploadPath: service?.uploadPath ?? uploadPath,
        dataPath: service?.dataPath ?? dataPath,
        cacheSize: parseInt(performance?.cacheSize, 10) ?? cacheSize,
      },
      health: {
        wasmThreshold: parseInt(performance?.health?.wasmDataThreshold, 10) ?? wasmDataThreshold,
        diskThresholdPercent: parseFloat(performance?.health?.diskThresholdPercent) ?? diskThresholdPercent,
        memoryThreshold: parseInt(performance?.health?.memoryThreshold, 10) ?? memoryThreshold,
      },
    };
  }

  static getInstance(): AppConfig {
    return this._instance ?? (this._instance = new AppConfig());
  }

  printUsage(verbose = false): void {
    const { app } = this._config;
    Logger.log(`${app.name} running on port ${app.port}...`);
    if (verbose) this.printVerbose();
  }

  printVerbose(): void {
    Logger.log(`Printing app config`, AppConfig.name);
    console.log(this._config);
  }
}

/**
 * Loads the configuration from the environment variables.
 * @returns {Config} the app config
 */
export const loadConfig = (): Config => AppConfig.getInstance().props;

export { AppConfig, Config };
