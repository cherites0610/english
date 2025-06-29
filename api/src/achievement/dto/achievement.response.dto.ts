import { ApiProperty } from '@nestjs/swagger';
import { ResponseDto } from 'src/common/dto/response.dto';
import { AchievementDto } from './achievement.dto';

// 用於返回單個 Achievement 的響應
export class AchievementResponse extends ResponseDto<AchievementDto> {
  @ApiProperty({ type: AchievementDto })
  declare data: AchievementDto;
}

// 用於返回 Achievement 陣列的響應
export class AchievementListResponse extends ResponseDto<AchievementDto[]> {
  @ApiProperty({ type: [AchievementDto] })
  declare data: AchievementDto[];
}
