import { Module } from '@nestjs/common';
import { TalkService } from './talk.service';
import { TalkController } from './talk.controller';
import { BattleModule } from 'src/battle/battle.module';
import { UserModule } from 'src/user/user.module';
import { GeminiModule } from 'src/gemini/gemini.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BattleChildCategory } from 'src/battle/entity/battle-child-category.entity';
import { TtsModule } from 'src/tts/tts.module';
import { TalkGateway } from './talk.gateway';

@Module({
  imports: [
    BattleModule,
    UserModule,
    GeminiModule,
    TypeOrmModule.forFeature([BattleChildCategory]),
    TtsModule
  ],
  controllers: [TalkController],
  providers: [TalkService,TalkGateway],
})
export class TalkModule { }
