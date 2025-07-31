import React from 'react';
import { FlatList } from 'react-native';
import FriendRequestItem from './FriendRequestItem';
import { useFriendPenddingList } from '@/src/hooks/useFriendPedding';


const FriendRequestsTab = () => {
    const { friendPenddingList, isLoading, error,handleAccept, handleReject } = useFriendPenddingList()

    return (
        <FlatList
            data={friendPenddingList}
            renderItem={({ item }) => (
                <FriendRequestItem request={item} onAccept={(id) => handleAccept(id)} onReject={(id) => handleReject(id)} />
            )}
            keyExtractor={item => item.id}
        />
    );
};
export default FriendRequestsTab;