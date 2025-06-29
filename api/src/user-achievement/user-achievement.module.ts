import { Module } from '@nestjs/common';
import { UserAchievementService } from './user-achievement.service';
import { UserAchievementController } from './user-achievement.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entity/user.entity';
import { UserAchievement } from './entity/user-achievement.entity';
import { Achievement } from 'src/achievement/entity/achievement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserAchievement, Achievement])],
  controllers: [UserAchievementController],
  providers: [UserAchievementService],
  exports: [UserAchievementService],
})
export class UserAchievementModule {}
