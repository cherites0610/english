import React, { useState } from 'react';
import { StyleSheet, Alert, ImageSourcePropType, ImageBackground, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import HouseLayout from '@/src/components/HouseLayout';
import Header from '@/src/components/Header';

type HouseData = {
    id: string;
    title: string;
    imageUrl: ImageSourcePropType;
};

export default function HouseMenuScreen() {
    const router = useRouter()
    const [title, setTitle] = useState<string>("Eating")

    const handleHousePress = (houseId: string, houseTitle: string) => {
        router.push({
            pathname: '/dialogue',
            params: { houseId, houseTitle },
        });
    };

    const handleGoBack = () => {
        router.back()
    };

    const houseData: HouseData[] = [
        { id: 'house1', title: '主屋', imageUrl: require('@/assets/images/MainScreen/house1.png') },
        { id: 'house2', title: '工坊', imageUrl: require('@/assets/images/MainScreen/house2.png') },
        { id: 'house3', title: '農場', imageUrl: require('@/assets/images/MainScreen/house3.png') },
        { id: 'house4', title: '礦場', imageUrl: require('@/assets/images/MainScreen/house4.png') },
        { id: 'house5', title: '碼頭', imageUrl: require('@/assets/images/MainScreen/house5.png') },
    ];

    return (
        <View style={{ flex: 1 }}>
            <Header
                variant="game"
                title={title}
                onBackPress={handleGoBack}
            />

            <ImageBackground
                source={require('@/assets/images/MainScreen/background.png')}
                style={styles.screen}
                resizeMode="stretch"
            >
                <Stack.Screen options={{ title: '建築選單' }} />
                <HouseLayout
                    houses={houseData}
                    onHousePress={(houseId) => {
                        const house = houseData.find(h => h.id === houseId);
                        if (house) {
                            handleHousePress(house.id, house.title);
                        }
                    }}
                    verticalOffset={-275}
                />
            </ImageBackground>
        </View>

    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
});