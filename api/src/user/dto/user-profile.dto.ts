import { ApiProperty } from '@nestjs/swagger';
import { EnglishProficiency } from '../entity/user.entity';

export class UserProfileDto {
  @ApiProperty({
    description: '使用者唯一ID',
    example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  })
  id: string;

  @ApiProperty({ description: '電子郵件', example: 'player@example.com' })
  email: string;

  @ApiProperty({ description: '使用者名稱', example: 'BraveAdventurer' })
  name: string;

  @ApiProperty({ description: '使用者等級', example: 15 })
  userLevel: number;

  @ApiProperty({ description: '持有金幣數量', example: 1200 })
  money: number;

  @ApiProperty({ description: '當前經驗值', example: 550 })
  experience: number;

  @ApiProperty({
    description: '英語能力等級',
    enum: EnglishProficiency,
    example: EnglishProficiency.INTERMEDIATE,
  })
  englishLevel: EnglishProficiency;

  @ApiProperty({ description: '帳號創建時間' })
  createdAt: Date;

  @ApiProperty({ description: '上次登入時間' })
  lastLoginAt: Date;
}
