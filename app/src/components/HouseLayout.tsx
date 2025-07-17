import React from 'react';
import { View, StyleSheet, ImageSourcePropType, ViewStyle } from 'react-native';
import HouseItem from './HouseItem';

type HouseData = {
    id: string;
    imageUrl: ImageSourcePropType;
    title: string;
};

type HouseLayoutProps = {
    houses: HouseData[];
    onHousePress: (houseId: string) => void;
    verticalOffset?: number;
    horizontalOffset?: number
};

const positionMap: { [count: number]: { top: number; left: number }[] } = {
    1: [{ top: 0.4, left: 0.4 }],
    2: [{ top: 0.2, left: 0.4 }, { top: 0.6, left: 0.25 }],
    3: [{ top: 0.15, left: 0.4 }, { top: 0.5, left: 0.15 }, { top: 0.5, left: 0.65 }],
    4: [{ top: 0.1, left: 0.2 }, { top: 0.1, left: 0.6 }, { top: 0.6, left: 0.2 }, { top: 0.6, left: 0.6 }],
    5: [
        { top: 0.1, left: 0.55 },   // 上上右
        { top: 0.35, left: 0.2 },  // 上左
        { top: 0.6, left: 0.55 },  // 中右
        { top: 0.85, left: 0.2 },   // 下左
        { top: 1.1, left: 0.55 },  // 下下左
    ],
};

const HouseLayout: React.FC<HouseLayoutProps> = ({ houses, onHousePress, verticalOffset = 0, horizontalOffset = 0 }) => {
    const houseCount = Math.min(houses.length, 5);
    const positions = positionMap[houseCount];

    return (
        <View style={styles.container}>
            {houses.slice(0, houseCount).map((house, index) => {
                const positionStyle = {
                    position: 'absolute' as const,
                    top: `${positions[index].top * 100}%`,
                    left: `${positions[index].left * 100}%`,
                    transform: [
                        { translateY: verticalOffset },
                        { translateX: horizontalOffset }
                    ]
                } as ViewStyle;

                return (
                    <View key={house.id} style={positionStyle}>
                        <HouseItem
                            imageUrl={house.imageUrl}
                            title={house.title}
                            onAnimationEnd={() => onHousePress(house.id)}
                        />
                    </View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: '60%',
        position: 'relative',
    },
});

export default HouseLayout;