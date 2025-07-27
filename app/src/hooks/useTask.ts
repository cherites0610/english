import { useState, useEffect } from 'react';
import { UserProfileData } from '../types'; // ✨ 我們將從新的 types 檔案匯入
import { fetchUserProfile } from '../services/userService';
import { Task } from '../types/task.type';
import { fetchTask } from '../services/taskService';

export function useTask(type: 'REGULAR' | 'ACHIEVEMENT') {
    const [task, setTask] = useState<Task[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                // 為了避免重複請求，可以加上一個判斷
                if (task) {
                    setIsLoading(false);
                    return;
                }

                setIsLoading(true);
                const fetchedTask = await fetchTask(type);
                setTask(fetchedTask);
            } catch (e) {
                setError('無法載入您的資料，請稍後再試。');
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []); // 依賴項為空，只在首次掛載時執行

    return { task, isLoading, error };
}