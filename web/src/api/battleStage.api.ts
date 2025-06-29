import type { BattleStageDto, CreateBattleStageDto, UpdateBattleStageDto } from '@/types/dto/battle.dto';
import apiClient from './apiClient';

import type { ResponseDto } from '@/types/api';

interface ApiService {
    getAll: () => Promise<ResponseDto<BattleStageDto[]>>;
    create: (payload: CreateBattleStageDto) => Promise<ResponseDto<BattleStageDto>>;
    update: (id: string, payload: UpdateBattleStageDto) => Promise<ResponseDto<BattleStageDto>>;
    delete: (id: string) => Promise<ResponseDto<null>>;
}

const battleStageApi: ApiService = {
    getAll: () => apiClient.get('/admin/battle/stages'),
    create: (payload) => apiClient.post('/admin/battle/stages', payload),
    update: (id, payload) => apiClient.patch(`/admin/battle/stages/${id}`, payload),
    delete: (id) => apiClient.delete(`/admin/battle/stages/${id}`),
};

export default battleStageApi;