import React from 'react';
import { View, Text, StyleSheet, Image, StyleProp, ViewStyle } from 'react-native';

type BaseBubbleProps = {
    children: React.ReactNode;
    size?: number;
    offsetX?: number;
    offsetY?: number;
    containerStyle?: StyleProp<ViewStyle>;
};

type ImageBubbleProps = {
    mode: 'image';
    imageUrl: string;
};

type CountBubbleProps = {
    mode: 'count';
    count: number;
};

export type BubbleProps = BaseBubbleProps & (ImageBubbleProps | CountBubbleProps);

const Bubble: React.FC<BubbleProps> = (props) => {
    const {
        children,
        size = 22,
        offsetX = 0,
        offsetY = 0,
        containerStyle,
    } = props;

    const shouldRenderBubble =
        (props.mode === 'count' && props.count > 0) || props.mode === 'image';

    if (!shouldRenderBubble) {
        return <>{children}</>;
    }

    const bubbleDynamicStyle = {
        width: size,
        height: size,
        borderRadius: size / 2,
        top: -(size / 3) + offsetY,
        right: -(size / 3) + offsetX,
    };

    const countTextStyle = {
        fontSize: size * 0.55,
    };

    return (
        <View style={[styles.container, containerStyle]}>
            {children}
            <View style={[styles.bubbleBase, bubbleDynamicStyle]}>
                {props.mode === 'image' ? (
                    <Image source={{ uri: props.imageUrl }} style={styles.image} />
                ) : (
                    <Text style={[styles.countText, countTextStyle]}>
                        {props.count > 99 ? '99' : props.count}
                    </Text>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignSelf: 'flex-start',
        position: 'relative',
    },
    bubbleBase: {
        position: 'absolute',
        backgroundColor: '#FF3B30',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    countText: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center'
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 999,
    },
});

export default Bubble;