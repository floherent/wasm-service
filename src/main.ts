import { NestFactory } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

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

  const swaggerConfig = new DocumentBuilder()
    .setTitle('wasm-service')
    .setDescription('API service for running WASM files')
    .setVersion('0.1.0')
    .addTag('health', 'endpoints for checking the health of the service')
    .addTag('config', 'endpoints for viewing the wasm-service configuration')
    .addTag('services', 'endpoints for managing wasm bundle files')
    .build();
  const openApidocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, openApidocument);

  await app.listen(appConfig.props.app.port);
  appConfig.printUsage();
}
bootstrap();
