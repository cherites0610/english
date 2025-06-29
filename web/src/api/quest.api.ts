import type { ResponseDto } from '@/types/api';
import apiClient from './apiClient';
import type { CreateQuestTemplateDto, QuestTemplateDto } from '@/types/dto/quest.dto';


// 引入任務相關的 DTO 類型


interface QuestApiService {
    getAllTemplates: () => Promise<ResponseDto<QuestTemplateDto[]>>;
    createTemplate: (payload: CreateQuestTemplateDto) => Promise<ResponseDto<QuestTemplateDto>>;
    updateTemplate: (id: string, payload: CreateQuestTemplateDto) => Promise<ResponseDto<QuestTemplateDto>>; // Update DTO 通常與 Create 類似
    deleteTemplate: (id: string) => Promise<ResponseDto<null>>;
}

const questApi: QuestApiService = {
    // 獲取所有任務模板
    getAllTemplates() {
        return apiClient.get('/admin/quest/templates');
    },
    // 創建新任務模板
    createTemplate(payload) {
        return apiClient.post('/admin/quest/templates', payload);
    },
    // 更新任務模板
    updateTemplate(id, payload) {
        return apiClient.patch(`/admin/quest/templates/${id}`, payload);
    },
    // 刪除任務模板
    deleteTemplate(id) {
        return apiClient.delete(`/admin/quest/templates/${id}`);
    },
};

export default questApi;