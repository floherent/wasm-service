import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { CqrsModule } from '@nestjs/cqrs';
import { HttpModule } from '@nestjs/axios';

import { AppConfigModule } from '@app/modules/config';
import { SocketModule } from '@app/modules/socket';
import { ExecHistoryMapper, WasmMapper, WasmRepo } from '@infra/wasm';
import { CqrsHandlers } from '@domain/wasm';
import { ServicesController } from './services.controller';
import { WasmService } from './wasm.service';

@Module({
  imports: [AppConfigModule, SocketModule, CqrsModule, HttpModule, MulterModule.register()],
  controllers: [ServicesController],
  providers: [
    WasmService,
    WasmMapper,
    ExecHistoryMapper,
    ...CqrsHandlers,
    { provide: 'IWasmRepo', useClass: WasmRepo },
  ],
})
export class ServicesModule {}
