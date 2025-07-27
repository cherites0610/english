import { Ionicons } from "@expo/vector-icons";

// User 相關
export type UserProfileData = {
    id: string;
    name: string;
    userLevel: number;
    money: number
    avatarUrl: string;
    achievements: Achievement[];
};

export type Achievement = {
    id: string;
    name: string;
    iconName: keyof typeof Ionicons.glyphMap;
};

export type Mail = {
    id: string;
    sender: string;
    title: string;
    isRead: boolean;
    receivedAt: string;
};

