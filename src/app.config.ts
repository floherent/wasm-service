import { Logger } from '@nestjs/common';
import { readFileSync as read } from 'fs';
import * as yaml from 'js-yaml';

const configPath: string = process.env['CS_CONFIG_PATH'] ?? './.config/config.yml';

interface Config {
  app: Partial<BaseConfig>;
  mongo: Partial<MongoConfig>;
}

interface BaseConfig {
  name: string;
  description: string;
  contextPath: string;
  port: number;
}

interface MongoConfig {
  uri?: string;
  database: string;
  host: string;
  username: string;
  password: string;
  options?: string;
}

class AppConfig {
  private static _instance: AppConfig;
  private readonly _config: Config;

  get config(): Config {
    return this._config;
  }

  private constructor() {
    Logger.log(`Loading config from ${configPath}`);

    const config = yaml.load(read(configPath, 'utf-8')) as Record<string, any>;
    const env = process.env;
    const mongo: MongoConfig = {
      uri: env['CS_MONGODB_URI'],
      database: env['CS_MONGODB_DATABASE'],
      host: env['CS_MONGODB_HOST'],
      username: env['CS_MONGODB_USERNAME'],
      password: env['CS_MONGODB_PASSWORD'],
      options: env['CS_MONGODB_OPTIONS'],
    };
    const mongoUri = mongo.uri ?? `mongodb://${mongo.host}/${mongo.database}/?${mongo.options}`;

    this._config = {
      app: {
        name: config?.name,
        description: config?.description,
        port: parseInt(config?.service?.port, 10) ?? 8080,
        contextPath: config?.service?.contextPath ?? '/',
      },
      mongo: {
        ...mongo,
        uri: mongoUri,
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
export const loadConfig = (): Config => AppConfig.getInstance().config;

export { AppConfig, Config };
