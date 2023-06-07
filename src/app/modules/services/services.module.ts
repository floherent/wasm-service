import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { CqrsModule } from '@nestjs/cqrs';

import { ServicesController } from './services.controller';
import { ExecHistoryMapper, WasmMapper, WasmRepo } from '@infra/wasm';
import { ExecuteWasmCommandHandler, UploadWasmCommandHandler } from '@domain/wasm';
import { AppConfig } from 'src/app.config';

@Module({
  imports: [CqrsModule, MulterModule.register()],
  controllers: [ServicesController],
  providers: [
    WasmMapper,
    ExecHistoryMapper,
    UploadWasmCommandHandler,
    ExecuteWasmCommandHandler,
    {
      provide: 'IWasmRepo',
      useClass: WasmRepo,
    },
    {
      provide: AppConfig,
      useFactory: (): AppConfig => AppConfig.getInstance(),
    },
  ],
})
export class ServicesModule {}
