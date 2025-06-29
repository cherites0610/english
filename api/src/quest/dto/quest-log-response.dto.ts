import { ApiProperty } from '@nestjs/swagger';
import { ResponseDto } from 'src/common/dto/response.dto'; // 您通用的 ResponseDto
import { QuestRequirementType } from '../enums/quest-requirement-type.enum';
import { QuestRewardType } from '../enums/quest-reward-type.enum';
import { QuestTemplateType } from '../enums/quest-template-type.enum';
import { UserQuestStatus } from '../enums/user-quest-status.enum';

/**
 * 代表單個需求的進度格式
 */
export class RequirementProgressDto {
  @ApiProperty({ enum: QuestRequirementType, description: '需求類型' })
  type: QuestRequirementType;

  @ApiProperty({ description: '當前完成數量' })
  currentCount: number;

  @ApiProperty({ description: '目標數量' })
  targetCount: number;
}

/**
 * 代表單個獎勵的格式
 */
export class RewardDto {
  @ApiProperty({ enum: QuestRewardType, description: '獎勵類型' })
  type: QuestRewardType;

  @ApiProperty({ description: '獎勵數量' })
  count: number;

  @ApiProperty({ description: '額外元數據 (例如用於解鎖任務)', nullable: true })
  metadata?: Record<string, any>;
}

/**
 * 代表返回給前端的、單個任務日誌的完整格式
 */
export class QuestLogEntryDto {
  @ApiProperty({ description: '任務日誌的唯一ID' })
  logId: string;

  @ApiProperty({ enum: UserQuestStatus, description: '任務狀態' })
  status: UserQuestStatus;

  @ApiProperty({ enum: QuestTemplateType, description: '任務模板類型' })
  questType: QuestTemplateType;

  @ApiProperty({ description: '任務標題' })
  title: string;

  @ApiProperty({ description: '任務描述' })
  description: string;

  @ApiProperty({
    type: [RequirementProgressDto],
    description: '任務需求列表及其進度',
  })
  requirements: RequirementProgressDto[];

  @ApiProperty({ type: [RewardDto], description: '任務獎勵列表' })
  rewards: RewardDto[];
}

/**
 * 專用於 getMyQuestLog 端點的、具體的響應 DTO
 * 它繼承自 ResponseDto<T>，並明確 T 為 QuestLogEntryDto[]
 */
export class GetQuestLogResponse extends ResponseDto<QuestLogEntryDto[]> {
  @ApiProperty({
    type: [QuestLogEntryDto], // <-- 這是關鍵，告訴 Swagger data 是一個陣列
    description: '玩家的任務日誌列表',
  })
  declare data: QuestLogEntryDto[];
}
