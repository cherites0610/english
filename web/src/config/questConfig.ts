/**
 * 任務模板類型的設定
 */
export const questTemplateTypeConfig = [
    { value: 'MAIN', label: '主線任務' },
    { value: 'SIDE', label: '支線任務' },
    { value: 'DAILY', label: '每日任務' },
    { value: 'ACHIEVEMENT', label: '成就任務' },
] as const;;

/**
 * 任務需求類型的設定
 * 目前需求都很簡單，只有 type 和 count，所以設定也較簡單
 */
export const questRequirementTypeConfig = [
    { value: 'KILL_SLIME', label: '擊殺史萊姆' },
    { value: 'KILL_GOBLIN_WARRIOR', label: '擊殺哥布林戰士' },
    { value: 'COLLECT_HERB', label: '採集藥草' },
    { value: 'TALK_TO_VILLAGE_CHIEF', label: '與村長對話' },
];

interface RewardConfigBase {
    readonly value: string;
    readonly label: string;
}

// 2. 定義「沒有」metadata 的獎勵設定
interface RewardConfigWithoutMetadata extends RewardConfigBase {
    readonly hasMetadata: false; // 關鍵：類型是字面量 false，而不是 boolean
}

// 3. 定義「有」metadata 的獎勵設定
interface RewardConfigWithMetadata extends RewardConfigBase {
    readonly hasMetadata: true; // 關鍵：類型是字面量 true
    readonly metadataFields: readonly {
        readonly key: string;
        readonly placeholder: string;
        readonly path: readonly string[];
    }[];
}

// 4. 最後，將它們組合成一個可辨識的聯合類型
export type RewardConfig = RewardConfigWithMetadata | RewardConfigWithoutMetadata;

export const questRewardTypeConfig: readonly RewardConfig[] = [
    { value: 'GAIN_GOLD', label: '獲得金幣', hasMetadata: false },
    { value: 'GAIN_EXPERIENCE', label: '獲得經驗值', hasMetadata: false },
    { value: 'RECEIVE_HEALTH_POTION', label: '獲得治療藥水', hasMetadata: false },
    {
        value: 'UNLOCK_QUEST',
        label: '解鎖任務',
        hasMetadata: true,
        metadataFields: [
            {
                key: 'questKey',
                placeholder: '要解鎖的 Quest Key',
                path: ['unlockQuestIdentifier', 'questKey'],
            },
        ],
    },
    {
        value: 'UNLOCK_ACHIEVEMENT',
        label: '解鎖成就',
        hasMetadata: true,
        metadataFields: [
            {
                key: 'achievementId',
                placeholder: '要解todo的 Achievement ID',
                path: ['achievementId'],
            },
        ],
    },
] as const;