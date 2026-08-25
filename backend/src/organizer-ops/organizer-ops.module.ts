import { Module } from '@nestjs/common';
import { OrganizerOpsController } from './organizer-ops.controller';
import { OrganizerOpsService } from './organizer-ops.service';

@Module({
  controllers: [OrganizerOpsController],
  providers: [OrganizerOpsService],
})
export class OrganizerOpsModule {}
