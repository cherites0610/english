import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Bubble from './Bubble';

export type ActionItemConfig = {
    id: string;
    iconName: keyof typeof Ionicons.glyphMap;
    onPress: (id: string) => void;
    bubbleCount?: number;
};

type SideActionBarProps = {
    actionItems: ActionItemConfig[];
};

const SideActionBar: React.FC<SideActionBarProps> = ({ actionItems }) => {
    return (
        <View style={styles.container}>
            {actionItems.map((item) => (
                <Bubble
                    key={item.id}
                    mode="count"
                    count={item.bubbleCount || 0}
                    size={24}
                    offsetX={-2}
                    offsetY={-2}
                >
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => item.onPress(item.id)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name={item.iconName} size={30} color="#4A4A4A" />
                    </TouchableOpacity>
                </Bubble>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: '20%',
        left: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        borderRadius: 20,
        paddingVertical: 12,
        paddingHorizontal: 10,
        gap: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    actionButton: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default SideActionBar;