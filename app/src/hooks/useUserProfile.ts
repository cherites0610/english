import { useState, useEffect } from 'react';
import { UserProfileData } from '../types/user.type'; // ✨ 我們將從新的 types 檔案匯入
import { fetchUserProfile } from '../services/userService';

export function useUserProfile() {
    const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                // 為了避免重複請求，可以加上一個判斷
                if (userProfile) {
                    setIsLoading(false);
                    return;
                }

                setIsLoading(true);
                const fetchedUser = await fetchUserProfile();
                setUserProfile(fetchedUser);
            } catch (e) {
                setError('無法載入您的資料，請稍後再試。');
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []); // 依賴項為空，只在首次掛載時執行

    return { userProfile, isLoading, error };
}