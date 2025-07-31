import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserProfileData } from '@/src/types/user.type';

export type FriendRequest = {
    id: string;
    name: string;
    avatarUrl: string;
};

type FriendAddItemProps = {
    user: UserProfileData;
    onAdd: (id: string) => void;
};

const FriendAddItem: React.FC<FriendAddItemProps> = ({ user, onAdd }) => {
    return (
        <View style={styles.container}>
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            <Text style={styles.name}>{user.name}</Text>
            <TouchableOpacity style={styles.iconButton} onPress={() => onAdd(user.id)}>
                <Ionicons name="add-circle" size={36} color="#2ECC71" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#ECF0F1',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    name: {
        flex: 1,
        fontSize: 15,
        color: '#2C3E50',
    },
    iconButton: {
        paddingLeft: 10,
    },
});

export default FriendAddItem;