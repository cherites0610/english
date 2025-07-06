import apiClient from './apiClient';
import { UserProfileData } from '../components/ProfileModal'; // 我們可以複用之前定義的類型

export const fetchUserProfile = async (): Promise<UserProfileData> => {
    try {
        // 使用 apiClient 發送 GET 請求到 /user/profile
        const response = await apiClient.get('/user/profile');

        // axios 會自動將回傳的 JSON 轉換為物件，並放在 response.data 中
        return response.data;
    } catch (error) {
        // 可以在這裡做更詳細的錯誤處理或日誌記錄
        console.error('獲取使用者資料失敗:', error);
        // 拋出錯誤，讓呼叫它的地方可以捕捉到
        throw error;
    }
};