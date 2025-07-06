import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type TaskProgressBarProps = {
    progress: number; // 0-100
};

const milestones = [
    { progress: 25, claimed: false },
    { progress: 50, claimed: true },
    { progress: 75, claimed: false }
];

const TaskProgressBar: React.FC<TaskProgressBarProps> = ({ progress }) => {
    return (
        <View style={styles.wrapper}>
            <Text style={styles.progressText}>每日活躍度: {progress}/100</Text>
            <View style={styles.barContainer}>
                <View style={[styles.progressBar, { width: `${progress}%` }]} />
                {milestones.map(m => {
                    const isAchieved = progress >= m.progress;
                    return (
                        <View key={m.progress} style={[styles.milestone, { left: `${m.progress}%` }]}>
                            <Ionicons
                                name={m.claimed ? 'gift' : 'gift-outline'}
                                size={32}
                                color={isAchieved ? '#F59E0B' : '#A0A0A0'}
                            />
                        </View>
                    )
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 45,
        alignItems: 'center',
    },
    barContainer: {
        width: '100%',
        height: 10,
        backgroundColor: '#E5E7EB',
        borderRadius: 5,
        marginTop: 20,
        justifyContent: 'center',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#3B82F6',
        borderRadius: 5,
    },
    milestone: {
        position: 'absolute',
        bottom: -38,
        transform: [{ translateX: -16 }],
    },
    progressText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
    },
});

export default TaskProgressBar;