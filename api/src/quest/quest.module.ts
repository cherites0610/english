import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

// Entities
import { QuestTemplate } from './entity/quest-template.entity';

// Services
import { QuestService } from './quest.service';

// Controllers
import { QuestController } from './quest.controller';
import { QuestAdminController } from './quest-admin.controller';
import { User } from 'src/user/entity/user.entity';
import { QuestRequirementTemplate } from './entity/quest-requirement-template.entity';
import { QuestRewardTemplate } from './entity/quest-reward-template.entity';
import { UserQuestLog } from './entity/user-quest-log.entity';
import { UserAchievementModule } from 'src/user-achievement/user-achievement.module';
import { QuestAdminService } from './quest-admin.service';

@Module({
  imports: [
    ScheduleModule.forRoot(), // 啟用排程模組
    TypeOrmModule.forFeature([
      QuestTemplate,
      QuestRequirementTemplate,
      QuestRewardTemplate,
      UserQuestLog,
      User,
    ]),
    UserAchievementModule,
  ],
  controllers: [QuestController, QuestAdminController],
  providers: [QuestService, QuestAdminService],
  exports: [QuestService],
})
export class QuestModule { }
