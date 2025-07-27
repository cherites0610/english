// Task 相關
export type Task = {
    id: string;
    title: string;
    description: string;
    isMainQuest?: boolean;
    progress?: number;
    goal?: number;
    isClaimed?: boolean;
};

export type fetchTaskResponse = {
    logId: string;
    status: TaskStatus;
    questType: TaskType;
    title: string;
    description: string;
    requirements: RequirementProgressDto[];
    rewards: RewardDto[];
}

export enum TaskStatus {
    IN_PROGRESS = 'IN_PROGRESS', // 進行中
    COMPLETED = 'COMPLETED', // 已完成，待領取獎勵
    CLAIMED = 'CLAIMED', // 已領取獎勵
    EXPIRED = 'EXPIRED', // (可選) 已過期
}

export enum TaskType {
    MAIN = 'MAIN', // 主線
    SIDE = 'SIDE', // 支線
    DAILY = 'DAILY', // 每日
    ACHIEVEMENT = 'ACHIEVEMENT', // 成就
}

export type RequirementProgressDto = {
    type: string;
    currentCount: number;
    targetCount: number;
}

export type RewardDto = {
    type: string;
    count: number;
    metadata?: Record<string, any>;
}