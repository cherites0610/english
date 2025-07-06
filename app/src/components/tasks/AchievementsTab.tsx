import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import TaskListItem, { Task } from './TaskListItem';

const achievementsData: Task[] = [
    { id: 'achieve_1', title: '初出茅廬', description: '完成你的第一個任務' },
    { id: 'achieve_2', title: '小小財主', description: '累計獲得10,000金幣' },
    { id: 'achieve_3', title: '百戰勇者', description: '贏得100場戰鬥' },
];

const AchievementsTab = () => {
    return (
        <View style={styles.container}>
            <FlatList
                data={achievementsData}
                renderItem={({ item }) => <TaskListItem task={item} />}
                keyExtractor={item => item.id}
                style={styles.list}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 16 },
    list: { paddingHorizontal: 16 },
});

export default AchievementsTab;