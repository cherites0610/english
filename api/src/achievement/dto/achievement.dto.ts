import { ApiProperty } from '@nestjs/swagger';

// 這個 DTO 用來在響應中展示成就模板的詳細資訊
export class AchievementDto {
  @ApiProperty({ description: '成就模板的唯一ID' })
  id: string;

  @ApiProperty({ description: '成就名稱' })
  name: string;

  @ApiProperty({ description: '成就圖片URL' })
  picture: string;

  @ApiProperty({ description: '成就達成方式的簡述' })
  acquisitionMethod: string;

  @ApiProperty({ description: '成就的詳細描述' })
  description: string;
}
