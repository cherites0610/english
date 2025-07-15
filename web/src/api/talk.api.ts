import apiClient from './apiClient';
import type { ResponseDto } from '../types/api';



interface TalkApiService {
    setPrompt: (prompt: string) => Promise<ResponseDto<any>>;
    getPrompt: () => Promise<ResponseDto<string>>;
    getSessionConText: (talkID:string) => Promise<ResponseDto<string>>;
    createTalk: (battleId: string) => Promise<ResponseDto<any>>;
    addMessage: (talkID: string, audioFile: File) => Promise<ResponseDto<any>>;
}

const talkApi: TalkApiService = {
    /**
     * 設定系統 Prompt
     */
    setPrompt(prompt: string) {
        // 發送一個包含 prompt 屬性的 JSON 物件
        return apiClient.post('/talk/prompt', { prompt });
    },

    /**
     * 獲取當前系統 Prompt
     */
    getPrompt() {
        return apiClient.get('/talk/prompt');
    },

    /**
     * 獲取當前對話 上下文
     */
    getSessionConText(talkID:string) {
        return apiClient.get(`/talk/${talkID}/context`);
    },

    /**
     * 根據 Battle ID 創建一個新的對話 Session
     */
    createTalk(battleId: string) {
        return apiClient.post(`/talk/${battleId}`);
    },

    /**
     * 上傳音檔並添加到指定的對話 Session
     * @param talkID 對話 Session 的 ID
     * @param audioFile 要上傳的 MP3 檔案
     */
    addMessage(talkID: string, audioFile: File) {
        // 為了上傳檔案，我們需要使用 FormData
        const formData = new FormData();
        // 'audio' 這個 key 必須與您 FileInterceptor('audio') 中的 key 匹配
        formData.append('audio', audioFile);

        // 發送 multipart/form-data 請求
        return apiClient.post(`/talk/${talkID}/message`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
};

export default talkApi;