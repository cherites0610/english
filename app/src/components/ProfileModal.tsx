import React from 'react';
import { View, Text, StyleSheet, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomModal from './CustomModal';

type Achievement = {
    id: string;
    name: string;
    iconName: keyof typeof Ionicons.glyphMap;
};

export type UserProfileData = {
    id: string;
    name: string;
    level: number;
    avatarUrl: string;
    achievements: Achievement[];
};

type ProfileModalProps = {
    isVisible: boolean;
    onClose: () => void;
    userData?: UserProfileData;
};

const ProfileModal: React.FC<ProfileModalProps> = ({ isVisible, onClose, userData }) => {
    if (!userData) return null;

    return (
        <CustomModal
            isVisible={isVisible}
            onClose={onClose}
            title="個人資料"
            buttons={[{ text: '關閉', onPress: onClose, style: 'primary' }]}
        >
            <View style={styles.container}>
                <View style={styles.infoSection}>
                    <Image source={{ uri: userData.avatarUrl }} style={styles.avatar} />
                    <Text style={styles.name}>{userData.name}</Text>
                    <Text style={styles.level}>等級 {userData.level}</Text>
                    <Text style={styles.userID}>ID: {userData.id}</Text>
                </View>
                <View style={styles.achievementSection}>
                    <Text style={styles.sectionTitle}>我的成就</Text>
                    <FlatList
                        data={userData.achievements}
                        renderItem={({ item }) => (
                            <View style={styles.achievementItem}>
                                <Ionicons name={item.iconName} size={30} color="#FFD700" />
                                <Text style={styles.achievementName} numberOfLines={1}>{item.name}</Text>
                            </View>
                        )}
                        keyExtractor={item => item.id}
                        numColumns={4}
                        contentContainerStyle={styles.achievementGrid}
                    />
                </View>
            </View>
        </CustomModal>
    );
};

const styles = StyleSheet.create({
    container: { width: '100%' },
    infoSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 12,
    },
    level: {
        fontSize: 16,
        color: '#3B82F6',
        fontWeight: '600',
        marginTop: 4,
    },
    userID: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 8,
    },
    achievementSection: {
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12,
    },
    achievementGrid: {
        alignItems: 'center',
    },
    achievementItem: {
        width: '25%',
        alignItems: 'center',
        paddingVertical: 8,
        gap: 4,
    },
    achievementName: {
        fontSize: 12,
        color: '#374151',
    },
});

export default ProfileModal;