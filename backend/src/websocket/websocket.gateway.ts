import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger, UnauthorizedException } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/',
})
export class WsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(WsGateway.name);
  private userSockets = new Map<string, Set<string>>();

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      if (token) {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: process.env.JWT_ACCESS_SECRET,
        });
        const userId = payload.sub;

        if (!this.userSockets.has(userId)) {
          this.userSockets.set(userId, new Set());
        }
        this.userSockets.get(userId)!.add(client.id);
        client.data.userId = userId;

        client.join(`user:${userId}`);
        this.logger.log(`User ${userId} connected via WebSocket`);
      } else {
        client.data.userId = null;
        this.logger.log('Anonymous client connected via WebSocket');
      }
    } catch {
      client.data.userId = null;
      this.logger.log('Unauthenticated client connected via WebSocket');
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId && this.userSockets.has(userId)) {
      this.userSockets.get(userId)!.delete(client.id);
      if (this.userSockets.get(userId)!.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join:project')
  handleJoinProject(@ConnectedSocket() client: Socket, @MessageBody() data: { projectId: string }) {
    if (!client.data.userId) return { error: 'Authentication required to join project rooms' };
    client.join(`project:${data.projectId}`);
    return { event: 'joined', room: `project:${data.projectId}` };
  }

  @SubscribeMessage('join:cypher')
  handleJoinCypher(@ConnectedSocket() client: Socket, @MessageBody() data: { cypherId: string }) {
    if (!client.data.userId) return { error: 'Authentication required to join cypher rooms' };
    client.join(`cypher:${data.cypherId}`);
    return { event: 'joined', room: `cypher:${data.cypherId}` };
  }

  @SubscribeMessage('join:live')
  handleJoinLive(@ConnectedSocket() client: Socket, @MessageBody() data: { id: string }) {
    if (!client.data.userId) return { error: 'Authentication required to join live rooms' };
    client.join(`live:${data.id}`);
    return { event: 'joined', room: `live:${data.id}` };
  }

  @SubscribeMessage('leave:project')
  handleLeaveProject(@ConnectedSocket() client: Socket, @MessageBody() data: { projectId: string }) {
    client.leave(`project:${data.projectId}`);
  }

  @SubscribeMessage('leave:cypher')
  handleLeaveCypher(@ConnectedSocket() client: Socket, @MessageBody() data: { cypherId: string }) {
    client.leave(`cypher:${data.cypherId}`);
  }

  @SubscribeMessage('leave:live')
  handleLeaveLive(@ConnectedSocket() client: Socket, @MessageBody() data: { id: string }) {
    client.leave(`live:${data.id}`);
  }

  @SubscribeMessage('live:chat_message')
  handleLiveChat(@ConnectedSocket() client: Socket, @MessageBody() data: { liveId: string; message: string }) {
    if (!client.data.userId) return { error: 'Authentication required to send messages' };
    const text = typeof data.message === 'string' ? data.message.slice(0, 1000) : '';
    if (!text.trim()) return { error: 'Message cannot be empty' };
    this.server.to(`live:${data.liveId}`).emit('live:chat_message', {
      userId: client.data.userId,
      message: text,
      timestamp: new Date().toISOString(),
    });
  }

  sendToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  sendToProject(projectId: string, event: string, data: unknown) {
    this.server.to(`project:${projectId}`).emit(event, data);
  }

  sendToCypher(cypherId: string, event: string, data: unknown) {
    this.server.to(`cypher:${cypherId}`).emit(event, data);
  }

  sendToLive(liveId: string, event: string, data: unknown) {
    this.server.to(`live:${liveId}`).emit(event, data);
  }
}
