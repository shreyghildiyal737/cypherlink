import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma/prisma.module';
import { CollectivesService } from './collectives.service';
import { CollectivesController } from './collectives.controller';

@Module({
  imports: [PrismaModule],
  controllers: [CollectivesController],
  providers: [CollectivesService],
  exports: [CollectivesService],
})
export class CollectivesModule {}
