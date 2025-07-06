import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export type Task = {
    id: string;
    title: string;
    description: string;
    isMainQuest?: boolean;
    progress?: number;
    goal?: number;
    isClaimed?: boolean;
};

type TaskListItemProps = {
    task: Task;
    isHighlighted?: boolean;
};

const TaskListItem: React.FC<TaskListItemProps> = ({ task, isHighlighted }) => {
    const hasProgress = typeof task.progress === 'number' && typeof task.goal === 'number';
    const isComplete = hasProgress && task.progress! >= task.goal!;

    let buttonText = '前往';
    let buttonStyle = styles.buttonGo;
    let buttonDisabled = false;

    if (isComplete) {
        if (task.isClaimed) {
            buttonText = '已領取';
            buttonStyle = styles.buttonClaimed;
            buttonDisabled = true;
        } else {
            buttonText = '領取';
            buttonStyle = styles.buttonClaim;
        }
    }

    return (
        <View style={[styles.container, isHighlighted && styles.highlightedContainer]}>
            <View style={styles.content}>
                <Text style={[styles.title, isHighlighted && styles.highlightedText]}>{task.title}</Text>
                <Text style={styles.description} numberOfLines={1}>{task.description}</Text>
                {hasProgress && (
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBarBackground}>
                            <View style={[styles.progressBar, { width: `${(task.progress! / task.goal!) * 100}%` }]} />
                        </View>
                        <Text style={styles.progressText}>{task.progress}/{task.goal}</Text>
                    </View>
                )}
            </View>
            <TouchableOpacity style={[styles.buttonBase, buttonStyle]} disabled={buttonDisabled}>
                <Text style={styles.buttonText}>{buttonText}</Text>
            </TouchableOpacity>
        </View>
    );
};
const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F7F7F7',
        borderRadius: 8,
        marginBottom: 10,
    },
    highlightedContainer: {
        backgroundColor: '#FFFBEA',
        borderColor: '#FFD60A',
        borderWidth: 1.5,
    },
    content: {
        flex: 1,
        marginRight: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    highlightedText: {
        color: '#B45309',
    },
    description: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    button: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 16,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    progressBarBackground: {
        flex: 1,
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        marginRight: 8,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#3B82F6',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
    },
    buttonBase: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonGo: {
        backgroundColor: '#007AFF',
    },
    buttonClaim: {
        backgroundColor: '#34D399',
    },
    buttonClaimed: {
        backgroundColor: '#9CA3AF',
    },
});

export default TaskListItem;