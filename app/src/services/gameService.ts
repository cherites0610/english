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
    { top: 50, left:100 },
    { top: 550, left:100 },
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