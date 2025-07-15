import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { refreshAuthToken } from './authService';
import { useAuth } from '../context/AuthContext';

const ACCESS_TOKEN_KEY = 'my-super-secret-access-token';
const REFRESH_TOKEN_KEY = 'my-super-secret-refresh-token';
// const { signOut } = useAuth();
export type ApiResponse<T> = {
    message: string;
    data: T;
};

const apiClient = axios.create({
    baseURL: 'https://shrew-smart-kit.ngrok-free.app/api',
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
        // signOut()
        return Promise.reject(error);
    }
);

// ✨ 回應攔截器 (Response Interceptor)
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
                if (!refreshToken) {
                    return Promise.reject(error);
                }

                const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await refreshAuthToken("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3YzdjNmY0MS02YzJjLTRkMGYtYmMwZS1kZjFhY2Y1ODk5ZjciLCJuYW1lIjoi5buW5p-P5a6JIiwiaWF0IjoxNzUyMTUzMDkwLCJleHAiOjE3NTQ3NDUwOTB9.riGJKlxHyRqEGc1_z8szqQICyPPVI4dApXmOeGicmWM");


                await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, newAccessToken);
                await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, newRefreshToken);

                apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

                return apiClient(originalRequest);
            } catch (refreshError: any) {
                console.error('Refresh token failed, user should be logged out.', refreshError);
                console.log(refreshError);
                // signOut()
                // 在這裡可以觸發全局登出事件
                return Promise.reject(refreshError);
            }
        }
        console.log(123);

        // 對於其他非 401 的錯誤，直接拋出
        return Promise.reject(error);
    }
);

export default apiClient;