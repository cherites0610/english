import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import TaskListItem, { Task } from './TaskListItem';
import TaskProgressBar from './TaskProgressBar';

const dailyTasksData: Task[] = [
    { id: 'main_quest', title: '主線：前往迷霧森林', description: '與長老對話以開始你的旅程', isMainQuest: true },
    { id: 'daily_1', title: '每日登入', description: '獎勵：金幣x100', progress: 1, goal: 1, isClaimed: true },
    { id: 'daily_2', title: '完成3場戰鬥', description: '獎勵：經驗藥水x2', progress: 3, goal: 3 },
    { id: 'daily_3', title: '採集10個藥草', description: '獎勵：金幣x200', progress: 4, goal: 10 },
];


const DailyTasksTab = () => {
    return (
        <View style={styles.container}>
            <TaskProgressBar progress={60} />
            <FlatList
                data={dailyTasksData}
                renderItem={({ item, index }) => (
                    <TaskListItem task={item} isHighlighted={index === 0} />
                )}
                keyExtractor={item => item.id}
                style={styles.list}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    list: { paddingHorizontal: 16 },
});

export default DailyTasksTab;