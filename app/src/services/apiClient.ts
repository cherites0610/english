import axios from "axios";
import * as SecureStore from "expo-secure-store";
import eventBus from "./eventBus";

const ACCESS_TOKEN_KEY = "my-super-secret-access-token";
const REFRESH_TOKEN_KEY = "my-super-secret-refresh-token";

export type ApiResponse<T> = {
  message: string;
  data: T;
};

const apiClient = axios.create({
  baseURL: "https://61def6c3e8a3.ngrok-free.app/api",
  timeout: 100000,
});

apiClient.interceptors.request.use(
  async (config) => {
    // await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, "cherites");
    // 在發送請求前，從 SecureStore 獲取 token
    const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);

    if (accessToken) {
      // 如果 token 存在，就將其加入到請求標頭中
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    console.error("Refresh token failed, emitting force-logout event.", error);
    eventBus.emit("force-logout");
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

        const { data } = await axios.post("/auth/refresh", { refreshToken });
        const newAccessToken = data.data.accessToken;
        const newRefreshToken = refreshToken;

        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, newAccessToken);
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, newRefreshToken);

        apiClient.defaults.headers.common["Authorization"] =
          `Bearer ${newAccessToken}`;
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

        return apiClient(originalRequest);
      } catch (refreshError: any) {
        console.error(
          "Refresh token failed, emitting force-logout event.",
          refreshError
        );
        eventBus.emit("force-logout");
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
