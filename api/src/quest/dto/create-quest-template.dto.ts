import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ValidateNested,
  IsArray,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { QuestRequirementType } from '../enums/quest-requirement-type.enum';
import { QuestRewardType } from '../enums/quest-reward-type.enum';
import { QuestTemplateType } from '../enums/quest-template-type.enum';

class RequirementDto {
  @ApiProperty({
    description: '任務需求的具體類型',
    enum: QuestRequirementType,
    example: QuestRequirementType.KILL_SLIME,
  })
  @IsEnum(QuestRequirementType)
  type: QuestRequirementType;

  @ApiProperty({
    description: '需要達成的數量',
    example: 10,
  })
  @IsInt()
  @Min(1)
  count: number;
}

class RewardDto {
  @ApiProperty({
    description: '任務獎勵的具體類型',
    enum: QuestRewardType,
    example: QuestRewardType.GAIN_GOLD,
  })
  @IsEnum(QuestRewardType)
  type: QuestRewardType;

  @ApiProperty({
    description: '獎勵的數量',
    example: 100,
  })
  @IsInt()
  @Min(1)
  count: number;

  @ApiProperty({
    description: '用於特殊獎勵類型的額外數據，例如 UNLOCK_QUEST',
    required: false,
    example: { unlockQuestIdentifier: { questKey: 'MAIN_QUEST_1_2' } },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class CreateQuestTemplateDto {
  @ApiProperty({
    description: '任務的標題',
    example: '全新的冒險',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: '任務的詳細描述',
    example: '這是一個引導玩家熟悉世界的任務。',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: '任務的模板類型 (主線、支線、每日、成就)',
    enum: QuestTemplateType,
    example: QuestTemplateType.MAIN,
  })
  @IsEnum(QuestTemplateType)
  type: QuestTemplateType;

  @ApiProperty({
    description: '用於程式碼引用的唯一業務鍵，通常用於主線或特殊任務',
    required: false,
    example: 'MAIN_QUEST_PROLOGUE',
  })
  @IsOptional()
  @IsString()
  questKey?: string;

  @ApiProperty({
    description: '任務包含的所有需求列表',
    type: [RequirementDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequirementDto)
  requirements: RequirementDto[];

  @ApiProperty({
    description: '任務完成後的所有獎勵列表',
    type: [RewardDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RewardDto)
  rewards: RewardDto[];
}
