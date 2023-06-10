import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { CqrsModule } from '@nestjs/cqrs';

import { ExecHistoryMapper, WasmMapper, WasmRepo } from '@infra/wasm';
import { CqrsHandlers } from '@domain/wasm';
import { ServicesController } from './services.controller';
import { WasmService } from './wasm.service';
import { AppConfig } from 'src/app.config';

@Module({
  imports: [CqrsModule, MulterModule.register()],
  controllers: [ServicesController],
  providers: [
    WasmService,
    WasmMapper,
    ExecHistoryMapper,
    ...CqrsHandlers,
    { provide: 'IWasmRepo', useClass: WasmRepo },
    { provide: AppConfig, useFactory: () => AppConfig.getInstance() },
  ],
})
export class ServicesModule {}
