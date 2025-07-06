import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomModal from './CustomModal';
import { useAuth } from '../context/AuthContext';

type SettingsModalProps = {
    isVisible: boolean;
    onClose: () => void;
};

const SettingsRow = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <View>{children}</View>
    </View>
);

const SettingsModal: React.FC<SettingsModalProps> = ({ isVisible, onClose }) => {
    const { signOut } = useAuth();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [musicVolume, setMusicVolume] = useState(3);
    const [lineBound, setLineBound] = useState(false);
    const [googleBound, setGoogleBound] = useState(true);

    const handleSignOut = () => {
        onClose(); // 先關閉 Modal
        // 延遲一點執行 signOut，給 Modal 關閉的動畫時間
        setTimeout(() => {
            signOut();
        }, 300);
    };

    return (
        <CustomModal
            isVisible={isVisible}
            onClose={onClose}
            title="設定"
            buttons={[{ text: '完成', onPress: onClose, style: 'primary' }]}
        >
            <View style={styles.content}>
                <SettingsRow label="推播通知">
                    <Switch
                        trackColor={{ false: '#767577', true: '#81b0ff' }}
                        thumbColor={notificationsEnabled ? '#f5dd4b' : '#f4f3f4'}
                        onValueChange={setNotificationsEnabled}
                        value={notificationsEnabled}
                    />
                </SettingsRow>

                <SettingsRow label="背景音樂">
                    <View style={styles.volumeContainer}>
                        {[1, 2, 3, 4, 5].map((level) => (
                            <TouchableOpacity key={level} onPress={() => setMusicVolume(level)}>
                                <Ionicons
                                    name={level <= musicVolume ? 'volume-medium' : 'volume-mute-outline'}
                                    size={28}
                                    color={level <= musicVolume ? '#007AFF' : '#CCC'}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                </SettingsRow>

                <SettingsRow label="LINE 帳號">
                    <TouchableOpacity
                        style={[styles.bindButton, lineBound && styles.boundButton]}
                        disabled={lineBound}
                    >
                        <Text style={[styles.bindButtonText, lineBound && styles.boundButtonText]}>
                            {lineBound ? '已綁定' : '前往綁定'}
                        </Text>
                    </TouchableOpacity>
                </SettingsRow>

                <SettingsRow label="Google 帳號">
                    <TouchableOpacity
                        style={[styles.bindButton, googleBound && styles.boundButton]}
                        disabled={googleBound}
                    >
                        <Text style={[styles.bindButtonText, googleBound && styles.boundButtonText]}>
                            {googleBound ? '已綁定' : '前往綁定'}
                        </Text>
                    </TouchableOpacity>
                </SettingsRow>

                <SettingsRow label="登出">
                    <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                        <Text style={styles.signOutButtonText}>登出帳號</Text>
                    </TouchableOpacity>
                </SettingsRow>
            </View>
        </CustomModal>
    );
};

const styles = StyleSheet.create({
    content: {
        gap: 24,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        fontSize: 16,
        color: '#333',
    },
    volumeContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    bindButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#007AFF',
        borderRadius: 8,
    },
    bindButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    boundButton: {
        backgroundColor: '#E5E5EA',
    },
    boundButtonText: {
        color: '#8E8E93',
    },
    signOutButton: {
        marginTop: 24,
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#FEE2E2',
        alignItems: 'center',
    },
    signOutButtonText: {
        color: '#DC2626',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default SettingsModal;