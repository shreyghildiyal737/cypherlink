import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PublicModule } from './public/public.module';
import { ProjectsModule } from './projects/projects.module';
import { CyphersModule } from './cyphers/cyphers.module';
import { SessionsModule } from './sessions/sessions.module';
import { MessagingModule } from './messaging/messaging.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SearchModule } from './search/search.module';
import { QrModule } from './qr/qr.module';
import { SafetyModule } from './safety/safety.module';
import { UploadModule } from './upload/upload.module';
import { WebSocketModule } from './websocket/websocket.module';
import { JobsModule } from './jobs/jobs.module';
import { OrganizerOpsModule } from './organizer-ops/organizer-ops.module';
import { AdminOpsModule } from './admin-ops/admin-ops.module';
import { DeveloperOpsModule } from './developer-ops/developer-ops.module';
import { ArtistsModule } from './artists/artists.module';
import { ScenesModule } from './scenes/scenes.module';
import { ClipsModule } from './clips/clips.module';
import { DiscoveryModule } from './discovery/discovery.module';
import { CollectivesModule } from './collectives/collectives.module';
import { PushModule } from './push/push.module';
import { AuthGuard } from './common/guards/auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_ACCESS_SECRET || 'dev-secret-change-in-production',
      signOptions: { expiresIn: process.env.ACCESS_TOKEN_TTL || '15m' },
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PublicModule,
    ProjectsModule,
    CyphersModule,
    SessionsModule,
    MessagingModule,
    NotificationsModule,
    SearchModule,

    QrModule,
    SafetyModule,
    UploadModule,
    WebSocketModule,
    JobsModule,
    OrganizerOpsModule,
    AdminOpsModule,
    DeveloperOpsModule,
    ArtistsModule,
    ScenesModule,
    ClipsModule,
    DiscoveryModule,
    CollectivesModule,
    PushModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
