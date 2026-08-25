import { Module } from '@nestjs/common';
import { DeveloperOpsController } from './developer-ops.controller';
import { DeveloperOpsService } from './developer-ops.service';

@Module({
  controllers: [DeveloperOpsController],
  providers: [DeveloperOpsService],
})
export class DeveloperOpsModule {}
