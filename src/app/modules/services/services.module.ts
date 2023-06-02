import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { CqrsModule } from '@nestjs/cqrs';

import { ServicesController } from './services.controller';
import { WasmMapper, WasmRepo } from '@infra/wasm';
import { UploadWasmCommandHandler } from '@domain/wasm';

@Module({
  imports: [CqrsModule, MulterModule.register({ dest: './uploads' })],
  controllers: [ServicesController],
  providers: [
    WasmMapper,
    UploadWasmCommandHandler,
    {
      provide: 'IWasmRepo',
      useClass: WasmRepo,
    },
  ],
})
export class ServicesModule {}
