import { useState, useEffect } from 'react';
import { Mail } from '../types/mail.type';
import { fetchMail, readMailRequest } from '../services/mailService';

export function useMail() {
    const [mail, setMail] = useState<Mail[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                // 為了避免重複請求，可以加上一個判斷
                if (mail) {
                    setIsLoading(false);
                    return;
                }

                setIsLoading(true);
                const fetchedMail = await fetchMail();
                setMail(fetchedMail);
            } catch (e) {
                setError('無法載入您的資料，請稍後再試。');
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []); // 依賴項為空，只在首次掛載時執行

    const readMail = async (id: string) => {
        try {
            await readMailRequest(id);

            setMail(currentMails => {
                return currentMails?.map(mail => {
                    if (mail.id === id) {
                        return { ...mail, isRead: true };
                    }
                    return mail;
                }) ?? []; // 如果 ?. 左側是 null/undefined，就回傳右側的 []
            });

        } catch (err) {
            console.error("讀取郵件失敗:", err);
            alert('操作失敗，請稍後再試');
        }
    };

    return { mail, isLoading, error, readMail };
}