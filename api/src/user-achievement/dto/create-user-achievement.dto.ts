import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

// 創建記錄時，前端只需提供 User 和 Achievement 的 ID 即可
export class CreateUserAchievementDto {
  @ApiProperty({ description: '要賦予成就的使用者ID' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: '要賦予的成就模板ID' })
  @IsUUID()
  achievementId: string;
}
