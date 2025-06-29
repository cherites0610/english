import type { questRequirementTypeConfig, questRewardTypeConfig, questTemplateTypeConfig } from '@/config/questConfig';
// import { QuestTemplateType, QuestRequirementType, QuestRewardType } from '../enums';
export type QuestTemplateType = typeof questTemplateTypeConfig[number]['value'];
export type QuestRequirementType = typeof questRequirementTypeConfig[number]['value'];
export type QuestRewardType = typeof questRewardTypeConfig[number]['value'];
// --- 用於 API 響應的 DTO ---

/**
 * API 響應中，單個需求模板的數據格式
 */
export interface QuestRequirementTemplateDto {
    id: string;
    type: QuestRequirementType;
    count: number;
}

/**
 * API 響應中，單個獎勵模板的數據格式
 */
export interface QuestRewardTemplateDto {
    id: string;
    type: QuestRewardType;
    count: number;
    metadata?: Record<string, any>;
}

/**
 * API 響應中，完整任務模板的數據格式
 */
export interface QuestTemplateDto {
    id: string;
    title: string;
    description: string;
    type: QuestTemplateType;
    questKey?: string;
    requirements: QuestRequirementTemplateDto[];
    rewards: QuestRewardTemplateDto[];
}


// --- 用於 API 請求體的 DTO ---

/**
 * 創建/更新任務時，單個需求的數據格式
 */
export interface RequirementDto {
    type: QuestRequirementType;
    count: number;
}

/**
 * 創建/更新任務時，單個獎勵的數據格式
 */
export interface RewardDto {
    type: QuestRewardType;
    count: number;
    metadata?: Record<string, any>;
}

/**
 * 用於創建新任務模板的請求體格式
 */
export interface CreateQuestTemplateDto {
    title: string;
    description: string;
    type: QuestTemplateType;
    questKey?: string;
    requirements: RequirementDto[];
    rewards: RewardDto[];
}

/**
 * 用於更新任務模板的請求體格式
 * 屬性均為可選
 */
export interface UpdateQuestTemplateDto {
    title?: string;
    description?: string;
    type?: QuestTemplateType;
    questKey?: string;
    requirements?: RequirementDto[];
    rewards?: RewardDto[];
}