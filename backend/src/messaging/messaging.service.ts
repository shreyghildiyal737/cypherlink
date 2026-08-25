import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { WsGateway } from '../websocket/websocket.gateway';
import { CreateMessageRequestDto } from './dto/create-message-request.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { NotificationType } from '@prisma/client';

@Injectable()
export class MessagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wsGateway: WsGateway,
  ) {}

  async getConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      include: {
        userA: { include: { profile: true } },
        userB: { include: { profile: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return conversations.map((conv) => {
      const isUserA = conv.userAId === userId;
      const otherUser = isUserA ? conv.userB : conv.userA;
      return {
        id: conv.id,
        otherUserId: otherUser.id,
        otherUserName: otherUser.displayName,
        otherUserHandle: otherUser.profile?.handle || '',
        otherUserAvatar: otherUser.profile?.avatarUrl,
        lastMessage: conv.messages[0]?.body || '',
        lastMessageAt: conv.messages[0]?.createdAt || conv.updatedAt,
        unreadCount: 0,
      };
    });
  }

  async createMessageRequest(dto: CreateMessageRequestDto, senderId: string) {
    if (dto.receiverId === senderId) throw new BadRequestException('Cannot send request to yourself');

    const receiver = await this.prisma.user.findUnique({ where: { id: dto.receiverId } });
    if (!receiver || receiver.deletedAt) throw new NotFoundException('User not found');

    // Check DM privacy
    if (receiver.dmPrivacy === 'NOBODY') throw new ForbiddenException('This user is not accepting messages');
    if (receiver.dmPrivacy === 'FOLLOWED_ONLY') {
      const follow = await this.prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: senderId, followingId: dto.receiverId } },
      });
      if (!follow) throw new ForbiddenException('This user only accepts messages from followed accounts');
    }

    // Check if already blocked
    const blocked = await this.prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId: dto.receiverId, blockedId: senderId } },
    });
    if (blocked) throw new ForbiddenException('You cannot message this user');

    const request = await this.prisma.messageRequest.create({
      data: {
        senderId,
        receiverId: dto.receiverId,
        intent: dto.intent,
        message: dto.message,
      },
    });

    // Push notification + live WS event to receiver
    await this.prisma.notification.create({
      data: {
        userId: dto.receiverId,
        type: NotificationType.MESSAGE_REQUEST,
        title: 'New Message Request',
        body: `Someone wants to ${dto.intent.toLowerCase().replace(/_/g, ' ')} with you`,
        referenceId: request.id,
      },
    });
    this.wsGateway.sendToUser(dto.receiverId, 'notification:new', {
      type: NotificationType.MESSAGE_REQUEST,
      title: 'New Message Request',
      body: `Someone wants to ${dto.intent.toLowerCase().replace(/_/g, ' ')} with you`,
      referenceId: request.id,
      readAt: null,
    });

    return request;
  }

  async getConversationMessages(conversationId: string, userId: string, cursor?: string, limit = 50) {
    const conversation = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.userAId !== userId && conversation.userBId !== userId) {
      throw new ForbiddenException('Not a participant in this conversation');
    }

    const where: Record<string, unknown> = { conversationId };
    if (cursor) {
      where['createdAt'] = { lt: new Date(cursor) };
    }

    const messages = await this.prisma.message.findMany({
      where,
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
    });

    const hasMore = messages.length > limit;
    const items = messages.slice(0, limit).reverse();
    const nextCursor = hasMore ? items[0]?.createdAt?.toISOString() : null;

    return {
      items: items.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        body: m.body,
        createdAt: m.createdAt,
      })),
      nextCursor,
      hasMore,
    };
  }

  async sendMessage(conversationId: string, dto: SendMessageDto, senderId: string) {
    const conversation = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.userAId !== senderId && conversation.userBId !== senderId) {
      throw new ForbiddenException('Not a participant in this conversation');
    }

    // Check if blocked
    const otherUserId = conversation.userAId === senderId ? conversation.userBId : conversation.userAId;
    const blocked = await this.prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId: otherUserId, blockedId: senderId } },
    });
    if (blocked) throw new ForbiddenException('You cannot message this user');

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        body: dto.body,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    const payload = {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      body: message.body,
      createdAt: message.createdAt,
    };

    // Push live message to the other participant's user room
    this.wsGateway.sendToUser(otherUserId, 'message:new', payload);

    return payload;
  }

  async getMessageRequests(userId: string) {
    const requests = await this.prisma.messageRequest.findMany({
      where: { receiverId: userId, status: 'pending' },
      include: { sender: { include: { profile: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return requests.map((r) => ({
      id: r.id,
      senderId: r.senderId,
      senderName: r.sender.displayName,
      senderHandle: r.sender.profile?.handle ?? '',
      intent: r.intent,
      message: r.message,
      createdAt: r.createdAt,
    }));
  }

  async declineMessageRequest(requestId: string, userId: string) {
    const request = await this.prisma.messageRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Request not found');
    if (request.receiverId !== userId) throw new ForbiddenException('Not your request');

    await this.prisma.messageRequest.update({
      where: { id: requestId },
      data: { status: 'declined' },
    });

    return { declined: true };
  }

  async acceptMessageRequest(requestId: string, userId: string) {
    const request = await this.prisma.messageRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Request not found');
    if (request.receiverId !== userId) throw new ForbiddenException('Not your request');

    // Create or find existing conversation
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        OR: [
          { userAId: request.senderId, userBId: request.receiverId },
          { userAId: request.receiverId, userBId: request.senderId },
        ],
      },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          userAId: request.senderId,
          userBId: request.receiverId,
        },
      });
    }

    // Add initial message
    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: request.senderId,
        body: request.message,
      },
    });

    // Update request status
    await this.prisma.messageRequest.update({
      where: { id: requestId },
      data: { status: 'accepted' },
    });

    return { conversationId: conversation.id };
  }
}
