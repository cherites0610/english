import { ApiProperty } from '@nestjs/swagger';
import { QuestTemplateType } from 'src/quest/enums/quest-template-type.enum';
import { QuestRequirementType } from 'src/quest/enums/quest-requirement-type.enum';
import { QuestRewardType } from 'src/quest/enums/quest-reward-type.enum';

class QuestRequirementTemplateDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: QuestRequirementType })
  type: QuestRequirementType;

  @ApiProperty()
  count: number;
}

class QuestRewardTemplateDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: QuestRewardType })
  type: QuestRewardType;

  @ApiProperty()
  count: number;

  @ApiProperty({ nullable: true })
  metadata?: Record<string, any>;
}

export class QuestTemplateDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: QuestTemplateType })
  type: QuestTemplateType;

  @ApiProperty({ nullable: true })
  questKey?: string;

  @ApiProperty({ type: [QuestRequirementTemplateDto] })
  requirements: QuestRequirementTemplateDto[];

  @ApiProperty({ type: [QuestRewardTemplateDto] })
  rewards: QuestRewardTemplateDto[];
}
