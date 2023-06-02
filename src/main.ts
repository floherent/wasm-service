import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';

import { AppModule } from './app.module';
import { AppConfig } from './app.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const appConfig = app.get(AppConfig);

  app.enableVersioning({ type: VersioningType.URI });
  app.enableCors();

  app.setGlobalPrefix(appConfig.config.app.contextPath);
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  await app.listen(appConfig.config.app.port);
  appConfig.printUsage();
}
bootstrap();
