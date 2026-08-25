import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { MessagingService } from './messaging.service';
import { CreateMessageRequestDto } from './dto/create-message-request.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Messaging')
@Controller('messages')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'Get all conversations for current user' })
  async getConversations(@CurrentUser('sub') userId: string) {
    return this.messagingService.getConversations(userId);
  }

  @Get('requests')
  @ApiOperation({ summary: 'Get pending message requests for current user' })
  async getRequests(@CurrentUser('sub') userId: string) {
    return this.messagingService.getMessageRequests(userId);
  }

  @Post('requests/:id/accept')
  @ApiOperation({ summary: 'Accept a message request' })
  async acceptRequest(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.messagingService.acceptMessageRequest(id, userId);
  }

  @Post('requests/:id/decline')
  @ApiOperation({ summary: 'Decline a message request' })
  async declineRequest(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.messagingService.declineMessageRequest(id, userId);
  }

  @Post('request')
  @ApiOperation({ summary: 'Send a message request with intent' })
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async createRequest(@Body() dto: CreateMessageRequestDto, @CurrentUser('sub') userId: string) {
    return this.messagingService.createMessageRequest(dto, userId);
  }

  @Get(':conversationId')
  @ApiOperation({ summary: 'Get messages in a conversation' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getMessages(
    @Param('conversationId') conversationId: string,
    @Query('cursor') cursor: string | undefined,
    @Query('limit') limit: string | undefined,
    @CurrentUser('sub') userId: string,
  ) {
    return this.messagingService.getConversationMessages(conversationId, userId, cursor, limit ? parseInt(limit) : 50);
  }

  @Post(':conversationId')
  @ApiOperation({ summary: 'Send a message in a conversation' })
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @Body() dto: SendMessageDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.messagingService.sendMessage(conversationId, dto, userId);
  }
}
