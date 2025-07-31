import React, { useState } from 'react';
import { FlatList, View } from 'react-native';
import FriendListItem, { Friend } from './FriendListItem';
import { useFriend } from '@/src/hooks/useFriend';

const FriendsListTab = () => {
    const { friends, deleteFriend } = useFriend()

    const goHome = (id: string) => {
        console.log(`去${id}的家`);

    }

    return (
        <FlatList
            data={friends}
            renderItem={({ item }) =>
                <FriendListItem onDelete={(id) => deleteFriend(id)} goHome={(id) => goHome(id)} friend={item} />
            }
            keyExtractor={item => item.id}
        />
    );
};
export default FriendsListTab;