import { NestFactory } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';

import { AppModule } from '@app/modules/app.module';
import { AppConfig } from '@app/modules/config';
import { ApiExceptionFilter, ApiValidationPipe } from '@shared/errors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const appConfig = app.get(AppConfig);

  app.enableVersioning({ type: VersioningType.URI });
  app.enableCors();

  app.setGlobalPrefix(appConfig.props.app.contextPath);
  app.useGlobalPipes(ApiValidationPipe);
  app.useGlobalFilters(new ApiExceptionFilter());
  app.use(bodyParser.json({ limit: appConfig.props.app.bodyLimit }));

  const swaggerConfig = new DocumentBuilder()
    .setTitle(appConfig.props.app.name)
    .setDescription(appConfig.props.app.description)
    .setVersion(appConfig.props.app.version)
    .addTag('health', 'checks the health status of the service')
    .addTag('config', 'retrieves the service configuration')
    .addTag('services', 'manages and executes wasm bundle files')
    .addTag('batch', 'manages batch operations')
    .build();
  const openApidocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, openApidocument);

  await app.listen(appConfig.props.app.port);
  appConfig.printUsage();
}
bootstrap();
