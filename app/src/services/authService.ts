import apiClient from './apiClient';

type AuthUrlResponse = {
    message: string,
    data: { url: string };
};

type RefreshAuthTokenResponse = {
    accessToken: string, refreshToken: string
};


export const getGoogleAuthUrl = async (): Promise<AuthUrlResponse> => {
    const response = await apiClient.get('/auth/google');
    return response.data;
};

export const getLineAuthUrl = async (): Promise<AuthUrlResponse> => {
    const response = await apiClient.get('/auth/line');
    return response.data;
};

export const refreshAuthToken = async (refreshToken: string): Promise<RefreshAuthTokenResponse> => {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return { accessToken: response.data.accessToken, refreshToken };
};