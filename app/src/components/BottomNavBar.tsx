import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export type TabConfig = {
    name: string;
    label: string;
    iconName: keyof typeof Ionicons.glyphMap;
};

type BottomNavBarProps = {
    activeTab: string;
    tabs: TabConfig[];
    onTabPress: (tabName: string) => void;
};

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, tabs, onTabPress }) => {
    return (
        <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.safeArea}>
            <View style={styles.container}>
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.name;
                    const iconColor = isActive ? '#007AFF' : '#8E8E93';

                    return (
                        <TouchableOpacity
                            key={tab.name}
                            style={styles.tabButton}
                            onPress={() => onTabPress(tab.name)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name={tab.iconName} size={26} color={iconColor} />
                            <Text style={[styles.tabLabel, { color: iconColor }]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
    },
    container: {
        flexDirection: 'row',
        height: 55,
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    tabButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2,
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: '500',
    },
});

export default BottomNavBar;