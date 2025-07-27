import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import TaskListItem, { Task } from './TaskListItem';
import { useTask } from '@/src/hooks/useTask';

const AchievementsTab = () => {
    const { task, isLoading, error } = useTask('ACHIEVEMENT');
    return (
        <View style={styles.container}>
            <FlatList
                data={task}
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