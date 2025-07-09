import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
  IsObject,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BattleTargetType } from 'src/battle/entity/battle-stage.entity';
import { CreateBattleRewardDto, BattleRewardDto } from './battle-reward.dto';
import { BattleChildCategoryDto } from './battle-child-category.dto';
import { NpcDto } from 'src/npc/dto/npc.dto'; // 引入 NPC DTO

/**
 * 創建對戰關卡的請求體格式
 */
export class CreateBattleStageDto {
  @ApiProperty({ description: '關卡名稱', example: '1-1: 尖峰時刻' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '關卡背景故事' })
  @IsString()
  @IsNotEmpty()
  backstory: string;

  @ApiProperty({
    description: '關卡目標列表',
    type: [String], // <-- 告訴 Swagger 這是一個字串陣列
    example: ['擊敗 10 隻史萊姆', '在 5 分鐘內完成'],
  })
  @IsArray()
  @IsString({ each: true }) // 驗證陣列中的每個元素都是字串
  targets: string[];

  @ApiProperty({ description: '所屬子分類的 ID' })
  @IsUUID()
  childCategoryId: string;

  @ApiProperty({ description: '關聯的 NPC 的 ID', required: false })
  @IsOptional()
  @IsUUID()
  npcId?: string;

  @ApiProperty({ description: '關卡獎勵列表', type: [CreateBattleRewardDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBattleRewardDto)
  rewards: CreateBattleRewardDto[];
}

/**
 * 更新對戰關卡的請求體格式
 */
export class UpdateBattleStageDto extends PartialType(CreateBattleStageDto) {}

/**
 * 用於 API 響應的對戰關卡數據格式 (包含所有關聯詳情)
 */
export class BattleStageDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  backstory: string;

  @ApiProperty({
    description: '關卡目標列表',
    type: [String], // <-- 告訴 Swagger 這是一個字串陣列
    example: ['擊敗 10 隻史萊姆', '在 5 分鐘內完成'],
  })
  @IsArray()
  @IsString({ each: true }) // 驗證陣列中的每個元素都是字串
  targets: string[];

  @ApiProperty({ type: () => BattleChildCategoryDto })
  category: BattleChildCategoryDto;

  @ApiProperty({ type: () => NpcDto, nullable: true })
  npc?: NpcDto;

  @ApiProperty({ type: [BattleRewardDto] })
  rewards: BattleRewardDto[];
}
