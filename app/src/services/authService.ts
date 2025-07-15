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
    try{
        const response = await apiClient.post<ApiResponse<{ accessToken: string }>>('/auth/refresh', { refreshToken });
        console.log(response);
        
        return { accessToken: response.data.data.accessToken, refreshToken };
    }catch(err:any) {
        console.log(123);
        return { accessToken: "1", refreshToken:"2" };
    }
    
};