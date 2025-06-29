import type { ResponseDto } from '@/types/api';
import type { FurnitureTemplateDto, CreateFurnitureTemplateDto, UpdateFurnitureTemplateDto } from '@/types/dto/furniture.dto';
import apiClient from './apiClient';




/**
 * 為我們的 API 服務物件定義一個清晰的接口，以獲得更好的類型提示
 */
interface FurnitureTemplateApiService {
    getAll: () => Promise<ResponseDto<FurnitureTemplateDto[]>>;
    getById: (id: string) => Promise<ResponseDto<FurnitureTemplateDto>>;
    create: (payload: CreateFurnitureTemplateDto) => Promise<ResponseDto<FurnitureTemplateDto>>;
    update: (id: string, payload: UpdateFurnitureTemplateDto) => Promise<ResponseDto<FurnitureTemplateDto>>;
    delete: (id: string) => Promise<ResponseDto<null>>;
}

const furnitureTemplateApi: FurnitureTemplateApiService = {
    /**
     * 獲取所有家具模板
     */
    getAll() {
        return apiClient.get('/admin/furniture-templates');
    },

    /**
     * 根據 ID 獲取單個家具模板
     * @param id 模板 ID
     */
    getById(id) {
        return apiClient.get(`/admin/furniture-templates/${id}`);
    },

    /**
     * 創建一個新的家具模板
     * @param payload 創建模板所需的數據
     */
    create(payload) {
        return apiClient.post('/admin/furniture-templates', payload);
    },

    /**
     * 更新一個現有的家具模板
     * @param id 要更新的模板 ID
     * @param payload 要更新的數據
     */
    update(id, payload) {
        return apiClient.patch(`/admin/furniture-templates/${id}`, payload);
    },

    /**
     * 刪除一個家具模板
     * @param id 要刪除的模板 ID
     */
    delete(id) {
        return apiClient.delete(`/admin/furniture-templates/${id}`);
    },
};

export default furnitureTemplateApi;