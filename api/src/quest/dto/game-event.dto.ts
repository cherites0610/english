import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, Min } from 'class-validator';
import { QuestRequirementType } from '../enums/quest-requirement-type.enum';

// 事件類型直接對應需求類型，以簡化處理
export type GameEventType = QuestRequirementType;
export const GameEventType = QuestRequirementType;

export class GameEventDto {
  @ApiProperty({
    description: '發生的遊戲事件類型，直接對應任務需求類型',
    enum: GameEventType,
    example: GameEventType.KILL_SLIME,
  })
  @IsEnum(GameEventType)
  eventType: GameEventType;

  @ApiProperty({
    description: '該事件發生的次數',
    example: 1,
  })
  @IsInt()
  @Min(1)
  count: number;
}
