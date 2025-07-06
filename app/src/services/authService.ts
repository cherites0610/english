import apiClient, { ApiResponse } from './apiClient';

type AuthUrlResponse = {
    url: string
};

type RefreshAuthTokenResponse = {
    accessToken: string, refreshToken: string
};


export const getGoogleAuthUrl = async (): Promise<AuthUrlResponse> => {
    const response = await apiClient.get<ApiResponse<AuthUrlResponse>>('/auth/google');
    return response.data.data;
};

export const getLineAuthUrl = async (): Promise<AuthUrlResponse> => {
    const response = await apiClient.get<ApiResponse<AuthUrlResponse>>('/auth/line');
    return response.data.data;
};

export const refreshAuthToken = async (refreshToken: string): Promise<RefreshAuthTokenResponse> => {
    const response = await apiClient.post<ApiResponse<{ accessToken: string }>>('/auth/refresh', { refreshToken });
    return { accessToken: response.data.data.accessToken, refreshToken };
};