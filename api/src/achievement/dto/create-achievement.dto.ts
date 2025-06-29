import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateAchievementDto {
  @ApiProperty({
    description: '成就的名稱',
    example: '初級探險家',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: '成就的圖示或圖片 URL',
    example: 'https://cdn.example.com/icons/achievements/explorer_badge.png',
  })
  @IsString()
  picture: string;

  @ApiProperty({
    description: '成就的達成方式簡述',
    example: '探索所有新手村地圖',
  })
  @IsString()
  acquisitionMethod: string;

  @ApiProperty({
    description: '成就的詳細背景故事或描述文字',
    example: '你已經踏遍了新手村的每一個角落，為未來的冒險奠定了堅實的基礎。',
  })
  @IsString()
  description: string;
}
