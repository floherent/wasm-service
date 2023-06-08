import { Logger } from '@nestjs/common';
import { readFileSync as read } from 'fs';
import * as yaml from 'js-yaml';

const configPath: string = process.env['CS_CONFIG_PATH'] ?? '.config/config.yml';
const contextPath = '/';
const uploadPath = './uploads';
const dataPath = './wasm-data.csv';
const servicePort = 8080;

interface Config {
  app: Partial<BaseConfig>;
}

interface BaseConfig {
  name: string;
  description: string;
  port: number;
  contextPath: string;
  uploadPath: string;
  dataPath: string;
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
    this._config = {
      app: {
        name: config?.name,
        description: config?.description,
        port: parseInt(config?.service?.port, 10) ?? servicePort,
        contextPath: config?.service?.contextPath ?? contextPath,
        uploadPath: config?.service?.uploadPath ?? uploadPath,
        dataPath: config?.service?.dataPath ?? dataPath,
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
