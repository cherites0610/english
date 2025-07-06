import React from 'react';
import { View, StyleSheet } from 'react-native';

const WaveformPlaceholder = () => {
    const barHeights = [20, 30, 40, 50, 35, 25, 15, 25, 35, 50, 40, 30, 20];

    return (
        <View style={styles.container}>
            {barHeights.map((height, index) => (
                <View key={index} style={[styles.bar, { height }]} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 60,
        gap: 4,
    },
    bar: {
        width: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 2,
    },
});

export default WaveformPlaceholder;