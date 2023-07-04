import { Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger: Logger = new Logger(SocketGateway.name);
  readonly clients = new Map<string, Socket>();

  @WebSocketServer()
  readonly server: Server;

  handleConnection(client: Socket) {
    const clientId = this.getClientId(client);
    if (!this.clients.has(clientId)) this.clients.set(clientId, client);
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const clientId = this.getClientId(client);
    if (this.clients.has(clientId)) this.clients.delete(clientId);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  getClient(clientId: string): Socket | undefined {
    const client = this.clients.get(clientId);
    if (!client) this.logger.warn(`Client not found: ${clientId}`);
    return client;
  }

  private getClientId(socket: Socket, clientIdKey = 'client-id'): string {
    return (socket.client.request.headers[clientIdKey] as string) || 'ws_' + socket.id;
  }
}
