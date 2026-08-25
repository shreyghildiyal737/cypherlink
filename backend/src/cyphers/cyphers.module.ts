import { Module } from '@nestjs/common';
import { CyphersController } from './cyphers.controller';
import { CyphersService } from './cyphers.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [CyphersController],
  providers: [CyphersService],
  exports: [CyphersService],
})
export class CyphersModule {}
