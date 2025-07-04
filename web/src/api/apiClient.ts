import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse, AxiosError } from 'axios';
import { ElMessage } from 'element-plus';
import type { ResponseDto } from '../types/api'; // 引入我們定義的響應接口
// 引入我們定義的響應接口

const apiClient: AxiosInstance = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}`, // 您後端的地址
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.TOKEN}`
    },
});

// 請求攔截器
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // 假設您將 admin token 存在 localStorage
        // 在真實應用中，應使用更安全的 token 管理方式，例如 Pinia/Vuex state
        const token = localStorage.getItem('admin_token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// --- 優化後的響應攔截器 ---
apiClient.interceptors.response.use(
    // 我們期望所有成功的響應都符合 ResponseDto<T> 的格式
    (response) => {
        // 直接返回後端響應中 `data` 欄位的內容
        // 這樣在呼叫 API 的地方就不需要再寫 .data.data
        return response.data;
    },
    (error: AxiosError) => {
        // 統一處理 API 錯誤
        // 嘗試從後端返回的錯誤響應中獲取 message
        const message = (error.response?.data as ResponseDto<null>)?.message || '發生未知錯誤';
        ElMessage.error(message);

        return Promise.reject(error);
    }
);

export default apiClient;