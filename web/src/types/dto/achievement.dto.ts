/**
 * 用於 API 響應的成就模板數據格式
 */
export interface AchievementDto {
    id: string;
    name: string;
    picture: string;
    acquisitionMethod: string;
    description: string;
}

/**
 * 用於創建新成就模板的請求體格式
 */
export interface CreateAchievementDto {
    name: string;
    picture: string;
    acquisitionMethod: string;
    description: string;
}

/**
 * 用於更新成就模板的請求體格式
 * 使用 Partial<T> 讓所有屬性都變為可選
 */
export type UpdateAchievementDto = Partial<CreateAchievementDto>;