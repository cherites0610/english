import { ApiProperty } from '@nestjs/swagger';
import { AchievementDto } from 'src/achievement/dto/achievement.dto';
import { UserProfileDto } from 'src/user/dto/user-profile.dto';

export class UserAchievementDto {
  @ApiProperty({ description: '使用者成就記錄的唯一ID' })
  id: string;

  @ApiProperty({ description: '使用者ID' })
  user: UserProfileDto;

  @ApiProperty({ description: '解鎖時間' })
  unlockedAt: Date;

  // 為了前端方便，我們直接內嵌成就的詳細資訊，而不是只給一個 achievementId
  @ApiProperty({ type: AchievementDto, description: '解鎖的成就詳情' })
  achievement: AchievementDto;
}
