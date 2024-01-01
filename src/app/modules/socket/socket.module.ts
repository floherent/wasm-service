import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AppConfigModule } from '@app/modules/config';
import { SocketGateway } from './socket.gateway';
import { SocketService } from './socket.service';

@Module({
  imports: [CqrsModule, AppConfigModule],
  providers: [SocketGateway, SocketService],
  exports: [SocketGateway, SocketService],
})
export class SocketModule {}
