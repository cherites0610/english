import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { refreshAuthToken } from './authService';

const ACCESS_TOKEN_KEY = 'my-super-secret-access-token';
const REFRESH_TOKEN_KEY = 'my-super-secret-refresh-token';

const apiClient = axios.create({
    baseURL: 'https://english-api.cherites.org/api',

    // 預設請求超時時間
    timeout: 10000,

    headers: {
        'Content-Type': 'application/json',
        // 'Authorization': 'Bearer YOUR_TOKEN' 
    },
});

apiClient.interceptors.request.use(
    async (config) => {
        const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // 檢查是否是 token 過期錯誤 (通常是 401)，並且這個請求沒有被重試過
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
                if (!refreshToken) return Promise.reject(error);

                const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await refreshAuthToken(refreshToken);

                // 更新 SecureStore 和 axios 預設標頭
                await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, newAccessToken);
                await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, newRefreshToken);
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;

                // 更新原始請求的標頭並重新發送
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                return apiClient(originalRequest);
            } catch (refreshError) {
                // 如果 refresh token 也失效，就需要強制登出
                // 這裡可以呼叫 signOut，或透過其他方式通知 AuthContext
                console.error('Refresh token failed, logging out.', refreshError);
                // await signOut(); // 在 service 層呼叫 context 方法比較複雜，通常會用事件或導航來處理
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);
export default apiClient;