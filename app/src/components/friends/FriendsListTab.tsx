import React, { useState } from 'react';
import { FlatList, View } from 'react-native';
import FriendListItem, { Friend } from './FriendListItem';

const initialFriends: Friend[] = [
    { id: '1', name: '鐵匠', avatarUrl: 'https://i.pravatar.cc/150?img=1', isOnline: true },
    { id: '2', name: '商人', avatarUrl: 'https://i.pravatar.cc/150?img=2', isOnline: false },
];

const FriendsListTab = () => {
    const [friends, setFriends] = useState(initialFriends);
    return (
        <FlatList
            data={friends}
            renderItem={({ item }) => <FriendListItem friend={item} />}
            keyExtractor={item => item.id}
        />
    );
};
export default FriendsListTab;