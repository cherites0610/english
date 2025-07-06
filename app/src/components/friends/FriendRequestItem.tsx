import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type FriendRequest = {
    id: string;
    name: string;
    avatarUrl: string;
};

type FriendRequestItemProps = {
    request: FriendRequest;
    onAccept: (id: string) => void;
    onReject: (id: string) => void;
};

const FriendRequestItem: React.FC<FriendRequestItemProps> = ({ request, onAccept, onReject }) => {
    return (
        <View style={styles.container}>
            <Image source={{ uri: request.avatarUrl }} style={styles.avatar} />
            <Text style={styles.name}>{request.name} 想加你為好友</Text>
            <TouchableOpacity style={styles.iconButton} onPress={() => onReject(request.id)}>
                <Ionicons name="close-circle" size={36} color="#E74C3C" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => onAccept(request.id)}>
                <Ionicons name="checkmark-circle" size={36} color="#2ECC71" />
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

export default FriendRequestItem;