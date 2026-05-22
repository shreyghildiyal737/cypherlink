import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { JobsService } from './jobs.service';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [ScheduleModule.forRoot(), UploadModule],
  providers: [JobsService],
})
export class JobsModule {}
