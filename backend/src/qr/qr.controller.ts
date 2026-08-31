import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { QrService } from './qr.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ScanProfileDto } from './dto/scan-profile.dto';

@ApiTags('QR')
@Controller('qr')
export class QrController {
  constructor(private readonly qrService: QrService) {}

  @Get('profile-token')
  @ApiOperation({ summary: 'Get QR profile token for current user' })
  async getProfileToken(@CurrentUser('sub') userId: string) {
    return this.qrService.getProfileToken(userId);
  }

  @Public()
  @Post('scan-profile')
  @ApiOperation({ summary: 'Scan a profile QR code — public, no login required' })
  async scanProfile(@Body() data: ScanProfileDto) {
    return this.qrService.scanProfile(data.profileToken);
  }
}
