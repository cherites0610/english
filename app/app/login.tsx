import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { useAuth } from '@/src/context/AuthContext';
import { getGoogleAuthUrl, getLineAuthUrl } from '@/src/services/authService';

export default function LoginScreen() {
    const { signIn } = useAuth();

    const handleLogin = async (provider: 'google' | 'line') => {
        try {
            const getAuthUrl = provider === 'google' ? getGoogleAuthUrl : getLineAuthUrl;
            const { url } = await getAuthUrl();
            if (!url) {
                throw new Error('無法獲取登入網址');
            }

            const redirectUri = makeRedirectUri({
                path: 'auth',
            });

            const result = await WebBrowser.openAuthSessionAsync(url, redirectUri);

            if (result.type === 'success' && result.url) {
                const urlObj = new URL(result.url);
                const accessToken = urlObj.searchParams.get('accessToken');
                const refreshToken = urlObj.searchParams.get('refreshToken');

                if (accessToken && refreshToken) {
                    signIn(accessToken, refreshToken);
                } else {
                    Alert.alert('登入失敗', '無法在回調網址中找到 token。');
                }
            } else if (result.type !== 'cancel' && result.type !== 'dismiss') {
                Alert.alert('登入失敗', '驗證流程中斷。');
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
                <TouchableOpacity style={[styles.button, styles.googleButton]} onPress={() => handleLogin('google')}>
                    <Ionicons name="logo-google" size={24} color="white" />
                    <Text style={styles.buttonText}>使用 Google 登入</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.lineButton]} onPress={() => handleLogin('line')}>
                    <Ionicons name="chatbubble-ellipses" size={24} color="white" />
                    <Text style={styles.buttonText}>使用 LINE 登入</Text>
                </TouchableOpacity>
            </View>
        </ImageBackground>
    );
}

// ... 樣式保持不變 ...
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