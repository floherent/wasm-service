import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { CqrsModule } from '@nestjs/cqrs';
import { HttpModule } from '@nestjs/axios';

import { AppConfigModule } from '@app/modules/config';
import { SocketModule } from '@app/modules/socket';
import { WasmService } from '@app/common/wasm.service';
import { ExecHistoryMapper, WasmMapper, WasmRepo } from '@infra/wasm';
import { BatchExecMapper, BatchMapper, BatchRepo } from '@infra/batch';
import { CqrsHandlers } from '@domain/wasm';
import { ServicesController } from './services.controller';

@Module({
  imports: [AppConfigModule, SocketModule, CqrsModule, HttpModule, MulterModule.register()],
  controllers: [ServicesController],
  providers: [
    WasmService,
    WasmMapper,
    ExecHistoryMapper,
    BatchMapper,
    BatchExecMapper,
    ...CqrsHandlers,
    { provide: 'IWasmRepo', useClass: WasmRepo },
    { provide: 'IBatchRepo', useClass: BatchRepo },
  ],
})
export class ServicesModule {}
