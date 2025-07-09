import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsObject, IsOptional, Min } from 'class-validator';
import { QuestRewardType } from 'src/quest/enums/quest-reward-type.enum';

/**
 * 在創建/更新對戰關卡時，用於描述單個獎勵的格式
 */
export class CreateBattleRewardDto {
  @ApiProperty({
    enum: QuestRewardType,
    description: '獎勵類型 (可複用任務系統的 Enum)',
  })
  @IsEnum(QuestRewardType)
  type: QuestRewardType;

  @ApiProperty({ description: '獎勵數量' })
  @IsInt()
  @Min(1)
  count: number;

  @ApiProperty({ description: '額外元數據', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * 用於 API 響應的對戰獎勵數據格式
 */
export class BattleRewardDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: QuestRewardType })
  type: QuestRewardType;

  @ApiProperty()
  count: number;

  @ApiProperty({ nullable: true })
  metadata?: Record<string, any>;
}
