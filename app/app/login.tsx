import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuthRequest, makeRedirectUri } from 'expo-auth-session';
import { useAuth } from '@/src/context/AuthContext';
import { getGoogleAuthUrl, getLineAuthUrl } from '@/src/services/authService';


export default function LoginScreen() {
    const { signIn } = useAuth();

    const redirectUri = makeRedirectUri({
        native: 'mou-english://auth',
    });

    const [request, response, promptAsync] = useAuthRequest(
        {
            clientId: 'placeholder-client-id',
            redirectUri,
        },
        // 這個 discovery 物件也是佔位符
        { authorizationEndpoint: 'https://placeholder.com/auth' }
    );

    useEffect(() => {
        if (response?.type === 'success' && response.params?.accessToken && response.params?.refreshToken) {
            const accessToken = response.params.accessToken as string;
            const refreshToken = response.params.refreshToken as string;
            signIn(accessToken, refreshToken); // ✨ 傳遞兩個 token
        } else if (response?.type === 'error' || (response?.type === 'success' && !response.params?.token)) {
            Alert.alert('登入失敗', '無法從驗證提供商獲取 token，請稍後再試。');
        }
    }, [response]);

    const handleLogin = async (provider: 'google' | 'line') => {
        try {
            const getAuthUrl = provider === 'google' ? getGoogleAuthUrl : getLineAuthUrl;
            const { data } = await getAuthUrl();

            if (data.url) {
                await promptAsync({ url: data.url });
            }
        } catch (error) {
            console.error(error);
            Alert.alert('登入錯誤', '似乎發生了一些問題，請檢查你的網路連線。');
        }
    };

    return (
        <ImageBackground
            source={require('@/assets/images/MainScreen/background.png')}
            style={styles.screen}
            resizeMode="stretch"
        >
            <View style={styles.container}>
                <Text style={styles.title}>歡迎回來！</Text>
                <TouchableOpacity
                    style={[styles.button, styles.googleButton]}
                    onPress={() => handleLogin('google')}
                    disabled={!request}
                >
                    <Ionicons name="logo-google" size={24} color="white" />
                    <Text style={styles.buttonText}>使用 Google 登入</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button, styles.lineButton]}
                    onPress={() => handleLogin('line')}
                    disabled={!request}
                >
                    <Ionicons name="chatbubble-ellipses" size={24} color="white" />
                    <Text style={styles.buttonText}>使用 LINE 登入</Text>
                </TouchableOpacity>
            </View>
        </ImageBackground>
    );
}

// ... 樣式不變 ...

const styles = StyleSheet.create({
    screen: { flex: 1 },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 40,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '80%',
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
    },
    googleButton: {
        backgroundColor: '#DB4437',
    },
    lineButton: {
        backgroundColor: '#00B900',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 15,
    },
});