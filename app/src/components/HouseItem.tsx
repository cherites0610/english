import React from 'react';
import { View, Text, StyleSheet, Image, Pressable, ImageSourcePropType } from 'react-native';
import Reanimated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS,
} from 'react-native-reanimated';

type HouseItemProps = {
    imageUrl: ImageSourcePropType;
    title: string;
    onAnimationEnd: () => void;
};

const HouseItem: React.FC<HouseItemProps> = ({ imageUrl, title, onAnimationEnd }) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    const handlePressIn = () => {
        scale.value = withTiming(0.9, { duration: 150 });
    };

    const handlePressOut = () => {
        scale.value = withTiming(1, { duration: 200 }, (isFinished) => {
            if (isFinished) {
                runOnJS(onAnimationEnd)();
            }
        });
    };

    return (
        <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
            <Reanimated.View style={[styles.container, animatedStyle]}>
                <Image source={imageUrl} style={styles.image} />
                <Text style={styles.title}>{title}</Text>
            </Reanimated.View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        gap: 4,
    },
    image: {
        width: 200,
        height: 200,
        resizeMode: 'contain',
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#3A3A3A',
    },
});

export default HouseItem;