import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type Mail = {
    id: string;
    sender: string;
    title: string;
    isRead: boolean;
    receivedAt: string;
};

type MailListItemProps = {
    mail: Mail;
    onPress: () => void;
};

const MailListItem: React.FC<MailListItemProps> = ({ mail, onPress }) => {
    const isUnread = !mail.isRead;

    return (
        <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.unreadDot, { opacity: isUnread ? 1 : 0 }]} />
            <View style={styles.iconContainer}>
                <Ionicons name="mail-outline" size={30} color="#555" />
            </View>
            <View style={styles.contentContainer}>
                <Text style={[styles.sender, isUnread && styles.unreadText]}>{mail.sender}</Text>
                <Text style={[styles.title, isUnread && styles.unreadText]} numberOfLines={1}>
                    {mail.title}
                </Text>
            </View>
            <Text style={styles.date}>{mail.receivedAt}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
        backgroundColor: 'white',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#007AFF',
        marginRight: 8,
    },
    iconContainer: {
        marginRight: 12,
    },
    contentContainer: {
        flex: 1,
        gap: 2,
    },
    sender: {
        fontSize: 16,
        color: '#000',
    },
    title: {
        fontSize: 14,
        color: '#666',
    },
    unreadText: {
        fontWeight: 'bold',
    },
    date: {
        fontSize: 12,
        color: '#999',
        marginLeft: 8,
    },
});

export default MailListItem;