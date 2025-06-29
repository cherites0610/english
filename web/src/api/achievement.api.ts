import type { ResponseDto } from '@/types/api';
import apiClient from './apiClient';
import type { AchievementDto, CreateAchievementDto, UpdateAchievementDto } from '@/types/dto/achievement.dto';


// 從後端 DTO 定義中引入對應的類型
// 建議將前端用到的 DTO 也都用 TS 定義好


// 定義 Service 物件的接口，增強類型提示
interface AchievementApiService {
    getAll: () => Promise<ResponseDto<AchievementDto[]>>;
    getById: (id: string) => Promise<ResponseDto<AchievementDto>>;
    create: (payload: CreateAchievementDto) => Promise<ResponseDto<AchievementDto>>;
    update: (id: string, payload: UpdateAchievementDto) => Promise<ResponseDto<AchievementDto>>;
    delete: (id: string) => Promise<ResponseDto<null>>;
}

const achievementApi: AchievementApiService = {
    // 獲取所有成就模板
    getAll() {
        return apiClient.get('/achievements');
    },
    // 根據 ID 獲取單個成就模板
    getById(id) {
        return apiClient.get(`/achievements/${id}`);
    },
    // 創建新成就模板
    create(payload) {
        return apiClient.post('/achievements', payload);
    },
    // 更新成就模板
    update(id, payload) {
        return apiClient.patch(`/achievements/${id}`, payload);
    },
    // 刪除成就模板
    delete(id) {
        return apiClient.delete(`/achievements/${id}`);
    },
};

export default achievementApi;