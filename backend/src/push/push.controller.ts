import { Controller, Post, Delete, Get, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PushService } from './push.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { SubscribePushDto, UnsubscribePushDto } from './dto/push.dto';

@ApiTags('Push')
@Controller('push')
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Get('vapid-public-key')
  @Public()
  @ApiOperation({ summary: 'Get VAPID public key for push subscription' })
  getPublicKey() {
    return { publicKey: this.pushService.getPublicKey() };
  }

  @Post('subscribe')
  @ApiOperation({ summary: 'Save a push subscription' })
  async subscribe(
    @Body() body: SubscribePushDto,
    @CurrentUser('sub') userId: string,
  ) {
    await this.pushService.saveSubscription(userId, body.endpoint, body.keys.p256dh, body.keys.auth);
    return { ok: true };
  }

  @Delete('subscribe')
  @ApiOperation({ summary: 'Remove a push subscription' })
  async unsubscribe(
    @Body() body: UnsubscribePushDto,
    @CurrentUser('sub') userId: string,
  ) {
    await this.pushService.deleteSubscription(body.endpoint, userId);
    return { ok: true };
  }
}
