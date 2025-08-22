import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Image, Pressable, ImageSourcePropType } from 'react-native';
import Reanimated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS,
} from 'react-native-reanimated';
import Bubble from './Bubble';
import Rive, { RiveRef } from 'rive-react-native';

type NpcItemProps = {
    imageUrl: ImageSourcePropType;
    bubbleCount?: number;
    onAnimationEnd: () => void;
};

const NpcItem: React.FC<NpcItemProps> = ({ imageUrl, bubbleCount, onAnimationEnd }) => {
    const scale = useSharedValue(1);
    const riveRef = useRef<RiveRef>(null);
    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    useEffect(() => {
        riveRef.current?.setInputState("State Machine 1", "finish", true);
    }, [])

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
        <Bubble mode="count" count={bubbleCount || 0} size={24} offsetX={8} offsetY={-2}>
            <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
                <Reanimated.View style={animatedStyle}>
                    <Rive
                        ref={riveRef}
                        resourceName="npc"
                        artboardName="Artboard"
                        stateMachineName="State Machine 1"
                        autoplay={true}
                        style={styles.rive}
                    />
                </Reanimated.View>
            </Pressable>
        </Bubble>
    );
};

const styles = StyleSheet.create({
    image: {
        width: 90,
        height: 90,
        resizeMode: 'contain',
    },
    rive: {
        width: 200,
        height: 200,
    },
});

export default NpcItem;