import { useState, useEffect } from 'react';
import { deleteFriendRequest, fetchFriendList } from '../services/friendService';
import { Friend } from '../types/friend.type';

export function useFriend() {
    const [friends, setFriends] = useState<Friend[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                if (friends) {
                    setIsLoading(false);
                    return;
                }

                setIsLoading(true);
                const fetchedFriends = await fetchFriendList();
                setFriends(fetchedFriends);
            } catch (e) {
                setError('無法載入您的資料，請稍後再試。');
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []); // 依賴項為空，只在首次掛載時執行

    const deleteFriend = async (friendId: string) => {
        try {
            await deleteFriendRequest(friendId)
            setFriends(prevFriend => prevFriend ? prevFriend?.filter(friend => friend.id !== friendId) : [])
        } catch (error) {
            alert('操作失敗，請稍後再試');
        }
    }

    return { friends, isLoading, error, deleteFriend };
}