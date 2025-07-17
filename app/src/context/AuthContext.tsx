import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import apiClient from '../services/apiClient'; // 我們需要 apiClient 來設定預設標頭
import eventBus from '../services/eventBus';

const ACCESS_TOKEN_KEY = 'my-super-secret-access-token';
const REFRESH_TOKEN_KEY = 'my-super-secret-refresh-token';

type AuthContextType = {
    signIn: (accessToken: string, refreshToken: string) => void;
    signOut: () => void;
    accessToken: string | null;
    isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
    const value = useContext(AuthContext);
    if (!value) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return value;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const signOut = async () => {
        setAccessToken(null);
        delete apiClient.defaults.headers.common['Authorization'];
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    };

    useEffect(() => {
        // 定義事件處理函式
        const handleForceLogout = () => {
            console.log('Received force-logout event, signing out...');
            signOut();
        };

        // 開始監聽 'force-logout' 事件
        eventBus.on('force-logout', handleForceLogout);

        // ✨ 重要：在元件卸載時，取消監聽，避免記憶體洩漏
        return () => {
            eventBus.off('force-logout', handleForceLogout);
        };
    }, []);

    useEffect(() => {
        const loadTokens = async () => {
            try {
                const storedAccessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);

                if (storedAccessToken) {
                    setAccessToken(storedAccessToken);
                    apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedAccessToken}`;
                }
            } catch (e) {
                console.error('Failed to load tokens', e);
            } finally {
                setIsLoading(false);
            }
        };
        loadTokens();
    }, []);

    const authContextValue: AuthContextType = {
        signIn: async (newAccessToken: string, newRefreshToken: string) => {
            setAccessToken(newAccessToken);
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
            await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, newAccessToken);
            await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, newRefreshToken);
        },
        signOut: async () => {
            setAccessToken(null);
            delete apiClient.defaults.headers.common['Authorization'];
            await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
            await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        },
        accessToken,
        isLoading,
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
}