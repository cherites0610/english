import { useState, useEffect, useCallback } from 'react';
import { Task } from '../types/task.type';
import { fetchTask } from '../services/taskService';
import { Friend } from '../types/friend.type';
import { acceptFriendRequest, fetchPenddingFriendList, rejectFriendRequest } from '../services/friendService';

export function useFriendPenddingList() {
    const [friendPenddingList, setFriendPenddingList] = useState<Friend[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                if (friendPenddingList) {
                    setIsLoading(false);
                    return;
                }

                setIsLoading(true);
                const fetchedFriends = await fetchPenddingFriendList();
                setFriendPenddingList(fetchedFriends);
            } catch (e) {
                setError('無法載入您的資料，請稍後再試。');
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const handleAccept = useCallback(async (id: string) => {
        try {
            await acceptFriendRequest(id);

            setFriendPenddingList(prevList =>
                prevList ? prevList.filter(friend => friend.id !== id) : null
            );
        } catch (err) {
            console.error("Accept request failed:", err);
            alert('操作失敗，請稍後再試');
        }
    }, []);

    const handleReject = useCallback(async (id: string) => {
        try {
            await rejectFriendRequest(id);

            setFriendPenddingList(prevList =>
                prevList ? prevList.filter(friend => friend.id !== id) : null
            );
        } catch (err) {
            console.error("Reject request failed:", err);
            alert('操作失敗，請稍後再試');
        }
    }, []);

    return { friendPenddingList, isLoading, error, handleAccept, handleReject };
}