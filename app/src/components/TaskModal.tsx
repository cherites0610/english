import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import CustomModal from './CustomModal';
import DailyTasksTab from './tasks/DailyTasksTab';
import AchievementsTab from './tasks/AchievementsTab';

type TaskModalProps = {
    isVisible: boolean;
    onClose: () => void;
};

type ActiveTab = 'daily' | 'achievements';

const TaskModal: React.FC<TaskModalProps> = ({ isVisible, onClose }) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('daily');

    return (
        <CustomModal
            isVisible={isVisible}
            onClose={onClose}
            title="任務"
            buttons={[{ text: '關閉', onPress: onClose, style: 'primary' }]}
        >
            <View style={styles.container}>
                <View style={styles.tabContainer}>
                    <TouchableOpacity onPress={() => setActiveTab('daily')}>
                        <Text style={[styles.tabText, activeTab === 'daily' && styles.activeTabText]}>日常任務</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setActiveTab('achievements')}>
                        <Text style={[styles.tabText, activeTab === 'achievements' && styles.activeTabText]}>成就任務</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.content}>
                    {activeTab === 'daily' ? <DailyTasksTab /> : <AchievementsTab />}
                </View>
            </View>
        </CustomModal>
    );
};

const styles = StyleSheet.create({
    container: { height: 500, width: '100%' },
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
        paddingBottom: 12,
    },
    tabText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    activeTabText: {
        color: '#007AFF',
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
});

export default TaskModal;