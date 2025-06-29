import type { ResponseDto } from '@/types/api';
import type { NpcDto, CreateNpcDto, UpdateNpcDto } from '@/types/dto/npc.dto';
import apiClient from './apiClient';


// 引入 NPC 相關的 DTO 類型


// 為我們的 API 服務物件定義一個清晰的接口
interface NpcApiService {
    getAll: () => Promise<ResponseDto<NpcDto[]>>;
    create: (payload: CreateNpcDto) => Promise<ResponseDto<NpcDto>>;
    update: (id: string, payload: UpdateNpcDto) => Promise<ResponseDto<NpcDto>>;
    delete: (id: string) => Promise<ResponseDto<null>>;
}

const npcApi: NpcApiService = {
    /**
     * 獲取所有 NPC 模板
     */
    getAll() {
        return apiClient.get('/admin/npcs');
    },

    /**
     * 創建一個新的 NPC 模板
     */
    create(payload) {
        return apiClient.post('/admin/npcs', payload);
    },

    /**
     * 更新一個現有的 NPC 模板
     */
    update(id, payload) {
        return apiClient.patch(`/admin/npcs/${id}`, payload);
    },

    /**
     * 刪除一個 NPC 模板
     */
    delete(id) {
        return apiClient.delete(`/admin/npcs/${id}`);
    },
};

export default npcApi;