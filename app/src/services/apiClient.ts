import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { refreshAuthToken } from './authService';

const ACCESS_TOKEN_KEY = 'my-super-secret-access-token';
const REFRESH_TOKEN_KEY = 'my-super-secret-refresh-token';

export type ApiResponse<T> = {
    message: string;
    data: T;
};

const apiClient = axios.create({
    baseURL: 'https://english-api.cherites.org/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ✨ 請求攔截器 (Request Interceptor)
apiClient.interceptors.request.use(
    async (config) => {
        // 在發送請求前，從 SecureStore 獲取 token
        const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
        if (accessToken) {
            // 如果 token 存在，就將其加入到請求標頭中
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// ✨ 回應攔截器 (Response Interceptor)
apiClient.interceptors.response.use(
    (response) => {
        // 任何 2xx 狀態碼的響應都會觸發這裡
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // 檢查是否是 token 過期錯誤 (通常是 401)，並且這個請求沒有被重試過
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
                if (!refreshToken) {
                    // 如果連 refresh token 都沒有，就直接拋出錯誤，觸發登出
                    // 這裡可以加入全局的登出邏輯
                    return Promise.reject(error);
                }

                const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await refreshAuthToken(refreshToken);

                await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, newAccessToken);
                await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, newRefreshToken);

                apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

                return apiClient(originalRequest);
            } catch (refreshError) {
                console.error('Refresh token failed, user should be logged out.', refreshError);
                // 在這裡可以觸發全局登出事件
                return Promise.reject(refreshError);
            }
        }

        // 對於其他非 401 的錯誤，直接拋出
        return Promise.reject(error);
    }
);

export default apiClient;