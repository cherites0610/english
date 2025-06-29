import { ApiProperty } from '@nestjs/swagger';
import { ResponseDto } from 'src/common/dto/response.dto';
import { UserAchievementDto } from './user-achievement.dto';

// 用於返回單個 UserAchievement 的響應
export class UserAchievementResponse extends ResponseDto<UserAchievementDto> {
  @ApiProperty({ type: UserAchievementDto })
  declare data: UserAchievementDto;
}

// 用於返回 UserAchievement 陣列的響應
export class UserAchievementListResponse extends ResponseDto<
  UserAchievementDto[]
> {
  @ApiProperty({ type: [UserAchievementDto] })
  declare data: UserAchievementDto[];
}
