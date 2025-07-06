import React, { useState } from 'react';
import { FlatList, View } from 'react-native';
import FriendRequestItem, { FriendRequest } from './FriendRequestItem';

const initialRequests: FriendRequest[] = [
    { id: '101', name: '旅人', avatarUrl: 'https://i.pravatar.cc/150?img=3' },
    { id: '102', name: '村民A', avatarUrl: 'https://i.pravatar.cc/150?img=4' },
];

const FriendRequestsTab = () => {
    const [requests, setRequests] = useState(initialRequests);
    const handleDecision = (id: string) => {
        setRequests(current => current.filter(req => req.id !== id));
    };
    return (
        <FlatList
            data={requests}
            renderItem={({ item }) => (
                <FriendRequestItem request={item} onAccept={handleDecision} onReject={handleDecision} />
            )}
            keyExtractor={item => item.id}
        />
    );
};
export default FriendRequestsTab;