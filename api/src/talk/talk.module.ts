import { Module } from '@nestjs/common';
import { TalkService } from './talk.service';
import { TalkController } from './talk.controller';
import { BattleModule } from 'src/battle/battle.module';
import { UserModule } from 'src/user/user.module';
import { GeminiModule } from 'src/gemini/gemini.module';

@Module({
  imports: [
    BattleModule,
    UserModule,
    GeminiModule
  ],
  controllers: [TalkController],
  providers: [TalkService],
})
export class TalkModule { }
