import { Logger, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { GeminiModule } from './gemini/gemini.module';
import { FriendShipModule } from './friend-ship/friend-ship.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AchievementModule } from './achievement/achievement.module';
import { UserAchievementModule } from './user-achievement/user-achievement.module';
import { QuestModule } from './quest/quest.module';
import { FurnitureModule } from './furniture/furniture.module';
import { HutModule } from './hut/hut.module';
import { CommunityModule } from './community/community.module';
import { NpcModule } from './npc/npc.module';
import { BattleModule } from './battle/battle.module';
import { TalkModule } from './talk/talk.module';
import { RedisModule } from './redis/redis.module';
import { MailModule } from './mail/mail.module'
import { TtsModule } from './tts/tts.module';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      global: true,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    RedisModule,
    UserModule,
    AuthModule,
    GeminiModule,
    FriendShipModule,
    AchievementModule,
    UserAchievementModule,
    QuestModule,
    FurnitureModule,
    HutModule,
    CommunityModule,
    NpcModule,
    BattleModule,
    TalkModule,
    MailModule,
    TtsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
