import { NpcProfession } from '../enums';

/**
 * 用於 API 響應的、單個 NPC 的公開數據格式
 * 這也是在前端列表中顯示的單個 NPC 物件的類型
 */
export interface NpcDto {
    id: string;
    name: string;
    avatar: string;
    voiceId: string;
    profession: NpcProfession;
    backstory: string;
}

/**
 * 用於「創建」新 NPC 的請求體（Payload）格式
 */
export interface CreateNpcDto {
    name: string;
    avatar: string;
    voiceId: string;
    profession: NpcProfession;
    backstory: string;
}

/**
 * 用於「更新」NPC 的請求體（Payload）格式
 * 使用 TypeScript 的 Partial<T> 工具類型，它會將 CreateNpcDto 的所有屬性都變為可選。
 */
export type UpdateNpcDto = Partial<CreateNpcDto>;