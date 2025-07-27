import { UserProfileData } from '../types';
import { fetchTaskResponse, Task, TaskType } from '../types/task.type';
import apiClient, { ApiResponse } from './apiClient';

export const fetchTask = async (type: 'REGULAR' | 'ACHIEVEMENT'): Promise<Task[]> => {
    try {
        const response = await apiClient.get<ApiResponse<fetchTaskResponse[]>>(`/quest?viewType=${type}`);
        const tasks = response.data.data

        return tasks.map(task => {
            return {
                id: task.logId,
                title: task.title,
                description: task.description,
                isMainQuest: task.questType === TaskType.MAIN,
                progress: task.requirements[0].currentCount,
                goal: task.requirements[0].targetCount,
                isClaimed: task.requirements[0].currentCount === task.requirements[0].targetCount
            };
        })


    } catch (error) {
        console.error('獲取使用者資料失敗:', error);
        throw error;
    }
};