import React from 'react';
import { View, StyleSheet, Image, ImageBackground } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import WaveformPlaceholder from '@/src/components/WaveformPlaceholder';
import Header from '@/src/components/Header';

export default function DialogueScreen() {
    const { houseTitle } = useLocalSearchParams<{ houseTitle: string }>();
    const router = useRouter()

    const handleGoBack = () => {
        router.back()
    };

    return (
        <View style={{ flex: 1 }}>
            <Header
                variant="game"
                title={houseTitle}
                onBackPress={handleGoBack}
            />

            <ImageBackground
                source={require('@/assets/images/Dialogue/background.png')}
                style={styles.screen}
                resizeMode="cover"
            >

                <View style={styles.characterContainer}>
                    <Image
                        source={require('@/assets/images/Dialogue/npc_full_body.png')}
                        style={styles.characterImage}
                    />
                </View>

                <View style={styles.controlsContainer}>
                    <WaveformPlaceholder />
                    <Ionicons name="mic-circle" size={80} color="white" />
                </View>
            </ImageBackground>
        </View>

    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        justifyContent: 'space-between',
    },
    characterContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 50,
    },
    characterImage: {
        width: '80%',
        height: '80%',
        resizeMode: 'contain',
    },
    controlsContainer: {
        paddingBottom: 40,
        alignItems: 'center',
    },
});