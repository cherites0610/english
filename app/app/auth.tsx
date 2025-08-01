import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function AuthCallbackScreen() {
    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#007AFF" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F0F2F5',
    },
});