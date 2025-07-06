import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Header from '../components/Header'; // 匯入 Header
import { useRouter } from 'expo-router';

export default function GameScreen() {
    const router = useRouter()
    const handleGoBack = () => {
        router.back()
    };

    return (
        <View style={styles.screen}>
            <Header
                variant="game"
                title="第一關"
                onBackPress={handleGoBack}
            />
            <View style={styles.content}>
                <Text>這是遊戲畫面的內容區域。</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});