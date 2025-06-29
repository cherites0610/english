import type { BattleParentCategoryDto, CreateBattleParentCategoryDto, UpdateBattleParentCategoryDto } from '@/types/dto/battle.dto';
import apiClient from './apiClient';
import type { ResponseDto } from '@/types/api';

interface ApiService {
    getAll: () => Promise<ResponseDto<BattleParentCategoryDto[]>>;
    create: (payload: CreateBattleParentCategoryDto) => Promise<ResponseDto<BattleParentCategoryDto>>;
    update: (id: string, payload: UpdateBattleParentCategoryDto) => Promise<ResponseDto<BattleParentCategoryDto>>;
    delete: (id: string) => Promise<ResponseDto<null>>;
}

const battleParentCategoryApi: ApiService = {
    getAll: () => apiClient.get('/admin/battle/parent-categories'),
    create: (payload) => apiClient.post('/admin/battle/parent-categories', payload),
    update: (id, payload) => apiClient.patch(`/admin/battle/parent-categories/${id}`, payload),
    delete: (id) => apiClient.delete(`/admin/battle/parent-categories/${id}`),
};

export default battleParentCategoryApi;