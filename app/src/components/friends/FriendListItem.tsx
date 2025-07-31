import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type Friend = {
    id: string;
    name: string;
    avatarUrl: string;
    isOnline: boolean;
};

type FriendListItemProps = {
    friend: Friend;
    onDelete: (id: string) => void;
    goHome: (id: string) => void;
};

const FriendListItem: React.FC<FriendListItemProps> = ({ friend,onDelete,goHome }) => {
    return (
        <View style={styles.container}>
            <View style={[styles.statusDot, { backgroundColor: friend.isOnline ? '#2ECC71' : '#95A5A6' }]} />
            <Image source={{ uri: friend.avatarUrl }} style={styles.avatar} />
            <Text style={styles.name}>{friend.name}</Text>
            <TouchableOpacity onPress={() => onDelete(friend.id)} style={styles.iconButton}>
                <Ionicons name='trash-outline' size={24} color="#3498DB" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => goHome(friend.id)} style={styles.iconButton}>
                <Ionicons name="home-outline" size={24} color="#3498DB" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#ECF0F1',
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 12,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    name: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#2C3E50',
    },
    iconButton: {
        padding: 8,
    },
});

export default FriendListItem;