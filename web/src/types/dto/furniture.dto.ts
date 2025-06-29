/**
 * 用於 API 響應的、單個家具模板的公開數據格式
 */
export interface FurnitureTemplateDto {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    width: number;
    height: number;
}

/**
 * 用於「創建」新家具模板的請求體（Payload）格式
 */
export interface CreateFurnitureTemplateDto {
    name: string;
    imageUrl: string;
    description: string;
    width: number;
    height: number;
}

/**
 * 用於「更新」家具模板的請求體（Payload）格式
 * 我們使用 TypeScript 的 Partial<T> 工具類型，它會將 CreateFurnitureTemplateDto 的所有屬性都變為可選。
 * 這非常適合 PATCH 操作。
 */
export type UpdateFurnitureTemplateDto = Partial<CreateFurnitureTemplateDto>;