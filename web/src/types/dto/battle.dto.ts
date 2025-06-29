import type { NpcDto } from "./npc.dto";
import type { QuestRewardType } from "./quest.dto";

/**
 * 用於 API 響應的「父對戰類型」數據格式
 */
export interface BattleParentCategoryDto {
    id: string;
    name: string;
    description?: string;
}

/**
 * 用於創建「父對戰類型」的請求體格式
 */
export interface CreateBattleParentCategoryDto {
    name: string;
    description?: string;
}

/**
 * 用於更新「父對戰類型」的請求體格式
 * (所有屬性均為可選)
 */
export type UpdateBattleParentCategoryDto = Partial<CreateBattleParentCategoryDto>;


// ======================================================
// == Battle Child Category DTOs (為求完整，一併提供)
// ======================================================

export interface BattleChildCategoryDto {
    id: string;
    name: string;
    description?: string;
    parent: BattleParentCategoryDto; // 內嵌父分類資訊
}

export interface CreateBattleChildCategoryDto {
    name: string;
    description?: string;
    parentId: string; // 創建時提供父分類的 ID
}

export type UpdateBattleChildCategoryDto = Partial<CreateBattleChildCategoryDto>;


// ======================================================
// == Battle Stage & Reward DTOs (為求完整，一併提供)
// ======================================================

export enum BattleTargetType {
    DEFEAT_ALL_ENEMIES = 'DEFEAT_ALL_ENEMIES',
    SURVIVE_FOR_TIME = 'SURVIVE_FOR_TIME',
    ANSWER_QUESTIONS = 'ANSWER_QUESTIONS',
}

export interface BattleRewardDto {
    id: string;
    type: QuestRewardType;
    count: number;
    metadata?: Record<string, any>;
}

export interface BattleStageDto {
    id: string;
    name: string;
    backstory: string;
    targetType: BattleTargetType;
    targetConfig: Record<string, any>;
    category: BattleChildCategoryDto;
    npc?: NpcDto;
    rewards: BattleRewardDto[];
}

export interface CreateBattleRewardDto {
    type: QuestRewardType;
    count: number;
    metadata?: Record<string, any>;
}

export interface CreateBattleStageDto {
    name: string;
    backstory: string;
    targetType: BattleTargetType;
    targetConfig: Record<string, any>;
    childCategoryId: string;
    npcId?: string;
    rewards: CreateBattleRewardDto[];
}

export type UpdateBattleStageDto = Partial<CreateBattleStageDto>;