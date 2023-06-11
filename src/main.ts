import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';

import { AppModule } from './app.module';
import { AppConfig } from '@app/modules/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const appConfig = app.get(AppConfig);

  app.enableVersioning({ type: VersioningType.URI });
  app.enableCors();

  app.setGlobalPrefix(appConfig.props.app.contextPath);
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  await app.listen(appConfig.props.app.port);
  appConfig.printUsage();
}
bootstrap();
