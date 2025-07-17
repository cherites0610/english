import { Ionicons } from '@expo/vector-icons';
import { ImageSourcePropType } from 'react-native';

export type TaskBriefing = {
    title: string;
    content: string;
    rewards: { name: string; icon: keyof typeof Ionicons.glyphMap; amount: number }[];
    characterImage: ImageSourcePropType;
};

export type NpcData = {
    id: string;
    imageUrl: ImageSourcePropType;
    bubbleCount?: number;
    task?: TaskBriefing; // NPC 可能攜帶一個任務
};

export type DisplayedNpc = NpcData & {
    position: { top: number; left: number };
};

const allNpcs: NpcData[] = [
    {
        id: '商人',
        imageUrl: require('../../assets/images/MainScreen/npc1.png'),
        bubbleCount: 1,
        task: {
            title: '商人的緊急請求',
            content: '我的貨物在運輸途中被哥布林搶走了！它們就在東邊的森林裡，請你務必幫我奪回來。我會給予你豐厚的報酬！',
            rewards: [
                { name: '金幣', icon: 'cash-outline', amount: 500 },
                { name: '經驗值', icon: 'star-outline', amount: 200 },
            ],
            characterImage: require('../../assets/images/MainScreen/npc1.png'),
        }
    },
    { id: '鐵匠', imageUrl: require('../../assets/images/MainScreen/npc2.png') },
    { id: '村民', imageUrl: require('../../assets/images/MainScreen/npc3.png') },
    { id: '農民', imageUrl: require('../../assets/images/MainScreen/npc4.png') },
    { id: '村長', imageUrl: require('../../assets/images/MainScreen/npc5.png') },
];

const spawnPoints = [
    { top: 1300 * 0.25, left: 100 * 0.65 },
    { top: 200 * 0.40, left: 400 * 0.05 },
    { top: 2500 * 0.25, left: 100 * 0.60 },
];

export type Mail = {
    id: string;
    sender: string;
    title: string;
    isRead: boolean;
    receivedAt: string;
};

export const initialMails: Mail[] = [
    { id: '1', sender: '系統管理員', title: '歡迎來到我們的世界！', isRead: false, receivedAt: '昨天' },
    { id: '2', sender: '鐵匠', title: '你的新工具已經打造好了', isRead: false, receivedAt: '2小時前' },
    { id: '3', sender: '商人', title: '限時特賣活動通知', isRead: true, receivedAt: '3天前' },
    { id: '4', sender: '村長', title: '關於即將到來的豐收祭...', isRead: false, receivedAt: '5分鐘前' },
    { id: '5', sender: '系統獎勵', title: '登入獎勵已發放', isRead: true, receivedAt: '1週前' },
];

// --- 核心邏輯：隨機生成函式 ---
function generateRandomNpcs(npcs: NpcData[], max: number): DisplayedNpc[] {
    const shuffledPoints = [...spawnPoints].sort(() => 0.5 - Math.random());
    const shuffledNpcs = [...npcs].sort(() => 0.5 - Math.random());
    const selectedNpcs = shuffledNpcs.slice(0, max);

    return selectedNpcs.map((npc, index) => ({
        ...npc,
        position: shuffledPoints[index],
    }));
}

// --- ✨ 關鍵：在模組頂層執行一次，並匯出結果 ---
export const displayedNpcs = generateRandomNpcs(allNpcs, 2);
export const initialUnreadMailCount = initialMails.filter(m => !m.isRead).length;