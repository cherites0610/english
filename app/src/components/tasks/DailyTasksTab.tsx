import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import TaskListItem, { Task } from './TaskListItem';
import TaskProgressBar from './TaskProgressBar';
import { useTask } from '@/src/hooks/useTask';

const DailyTasksTab = () => {
    const { task, isLoading, error } = useTask('REGULAR');
    
    return (
        <View style={styles.container}>
            <TaskProgressBar progress={60} />
            <FlatList
                data={task}
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