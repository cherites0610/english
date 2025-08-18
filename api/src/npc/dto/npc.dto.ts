import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsUrl,
  IsOptional,
} from 'class-validator';

/**
 * 用於創建新 NPC 的請求體格式
 */
export class CreateNpcDto {
  @ApiProperty({ description: 'NPC 的名稱', example: '老鐵匠巴頓' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'NPC 的頭像圖片 URL',
    example: 'https://cdn.example.com/avatars/npc/barton.png',
  })
  @IsUrl()
  avatar: string;

  @ApiProperty({
    description: '對應的聲音檔案編號',
    example: 'voice_barton_01',
  })
  @IsString()
  @IsNotEmpty()
  googleVoiceId: string;

  @IsString()
  @IsNotEmpty()
  elevenlabsVoiceId: string;

  @ApiProperty({
    description: 'NPC 的背景故事',
    example:
      '巴頓曾是王國最好的武器匠，但在一場戰爭中失去了他的兒子後，便隱居在這個小村莊裡。',
  })
  @IsString()
  @IsNotEmpty()
  backstory: string;
}

/**
 * 用於更新 NPC 的請求體格式
 * PartialType 會自動將 CreateNpcDto 的所有屬性變為可選
 */
export class UpdateNpcDto extends PartialType(CreateNpcDto) { }

/**
 * 用於 API 響應的、公開的 NPC 數據格式
 */
export class NpcDto {
  @ApiProperty({ description: 'NPC 的唯一ID' })
  id: string;

  @ApiProperty({ description: 'NPC 的名稱' })
  name: string;

  @ApiProperty({ description: 'NPC 的頭像圖片 URL' })
  avatar: string;

  @ApiProperty({ description: '對應的聲音檔案編號' })
  googleVoiceId: string;

  elevenlabsVoiceId: string;

  @ApiProperty({ description: 'NPC 的背景故事' })
  backstory: string;
}
