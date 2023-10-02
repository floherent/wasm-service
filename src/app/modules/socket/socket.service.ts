import { Injectable } from '@nestjs/common';

import { SocketGateway } from './socket.gateway';

@Injectable()
export class SocketService {
  constructor(private readonly gateway: SocketGateway) {}

  emit<T extends PublishMessageDto>(pattern: string, data: T): void {
    this.gateway.getClient(data.client_id)?.emit(pattern, data);
  }
}

export interface PublishMessageDto {
  readonly id: string; // batch id
  readonly client_id: string;
  readonly token?: string;
}
