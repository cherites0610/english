import type { BattleChildCategoryDto, CreateBattleChildCategoryDto, UpdateBattleChildCategoryDto } from '@/types/dto/battle.dto';
import apiClient from './apiClient';
import type { ResponseDto } from '@/types/api';

interface ApiService {
    getAll: () => Promise<ResponseDto<BattleChildCategoryDto[]>>;
    create: (payload: CreateBattleChildCategoryDto) => Promise<ResponseDto<BattleChildCategoryDto>>;
    update: (id: string, payload: UpdateBattleChildCategoryDto) => Promise<ResponseDto<BattleChildCategoryDto>>;
    delete: (id: string) => Promise<ResponseDto<null>>;
}

const battleChildCategoryApi: ApiService = {
    getAll: () => apiClient.get('/admin/battle/child-categories'),
    create: (payload) => apiClient.post('/admin/battle/child-categories', payload),
    update: (id, payload) => apiClient.patch(`/admin/battle/child-categories/${id}`, payload),
    delete: (id) => apiClient.delete(`/admin/battle/child-categories/${id}`),
};

export default battleChildCategoryApi;