import { addMessageResponse, createTalkResponse } from '../types/talk.type';
import apiClient, { ApiResponse } from './apiClient';

export const createTalkByCategoryName = async (categoryName: string) => {
    try {
        const response = await apiClient.post<ApiResponse<createTalkResponse>>(`/talk/category/${categoryName}`);
        const AiMessage = response.data.data
        return AiMessage


    } catch (error) {
        console.error('獲取使用者資料失敗:', error);
        throw error;
    }
};

export const addMessage = async (talkID: string, formData: FormData) => {
    try {
        console.log(formData);
        console.log(`/talk/${talkID}/message`);

        const response = await apiClient.post<ApiResponse<addMessageResponse>>(`/talk/${talkID}/message`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        const messages = response.data.data
        return messages
    } catch (error) {
        console.error('獲取使用者資料失敗:', error);
        throw error;
    }
};