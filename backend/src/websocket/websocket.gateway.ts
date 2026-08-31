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
import { Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

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

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  // Joining a room means receiving everything broadcast to it, so each join is
  // checked against the same membership the HTTP layer enforces. Being logged
  // in is not enough on its own - project rooms carry private messages and file
  // events, and the ids are guessable.
  private async canJoinProject(projectId: string, userId: string): Promise<boolean> {
    const [owned, membership] = await Promise.all([
      this.prisma.project.findFirst({
        where: { id: projectId, ownerId: userId, deletedAt: null },
        select: { id: true },
      }),
      this.prisma.projectMember.findFirst({
        where: { projectId, userId, status: 'ACTIVE', removedAt: null },
        select: { id: true },
      }),
    ]);
    return Boolean(owned || membership);
  }

  // Organiser, RSVP or check-in. Both cypher types (OPEN and VENUE) are
  // discoverable, so this is not about secrecy - it keeps the realtime channel
  // to people actually attending rather than anyone holding an id.
  private async canJoinCypher(cypherId: string, userId: string): Promise<boolean> {
    const [organised, rsvp, checkIn] = await Promise.all([
      this.prisma.cypher.findFirst({
        where: { id: cypherId, organizerId: userId, deletedAt: null },
        select: { id: true },
      }),
      this.prisma.cypherRSVP.findFirst({ where: { cypherId, userId }, select: { id: true } }),
      this.prisma.cypherCheckIn.findFirst({ where: { cypherId, userId }, select: { id: true } }),
    ]);
    return Boolean(organised || rsvp || checkIn);
  }

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
  async handleJoinProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return { error: 'Authentication required to join project rooms' };
    if (typeof data?.projectId !== 'string' || !data.projectId) {
      return { error: 'projectId is required' };
    }
    if (!(await this.canJoinProject(data.projectId, userId))) {
      return { error: 'Not a member of this project' };
    }
    client.join(`project:${data.projectId}`);
    return { event: 'joined', room: `project:${data.projectId}` };
  }

  @SubscribeMessage('join:cypher')
  async handleJoinCypher(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { cypherId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return { error: 'Authentication required to join cypher rooms' };
    if (typeof data?.cypherId !== 'string' || !data.cypherId) {
      return { error: 'cypherId is required' };
    }
    if (!(await this.canJoinCypher(data.cypherId, userId))) {
      return { error: 'RSVP to this cypher before joining its room' };
    }
    client.join(`cypher:${data.cypherId}`);
    return { event: 'joined', room: `cypher:${data.cypherId}` };
  }

  @SubscribeMessage('leave:project')
  handleLeaveProject(@ConnectedSocket() client: Socket, @MessageBody() data: { projectId: string }) {
    client.leave(`project:${data.projectId}`);
  }

  @SubscribeMessage('leave:cypher')
  handleLeaveCypher(@ConnectedSocket() client: Socket, @MessageBody() data: { cypherId: string }) {
    client.leave(`cypher:${data.cypherId}`);
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
}
