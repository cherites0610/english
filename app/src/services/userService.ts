import { UserProfileData } from '../types';
import apiClient, { ApiResponse } from './apiClient';

export const fetchUserProfile = async (): Promise<UserProfileData> => {
    try {
        const response = await apiClient.get<ApiResponse<UserProfileData>>('/user/profile');
        return response.data.data;
    } catch (error) {
        console.error('獲取使用者資料失敗:', error);
        throw error;
    }
};