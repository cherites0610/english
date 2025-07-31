import { UserProfileData } from '@/src/types/user.type';
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, Pressable } from 'react-native';
import FriendAddItem from './FriendAddItem';
import { addFriend, queryUser } from '@/src/services/friendService';

const AddFriendTab = () => {
    const [query, setQuery] = useState('');
    const [users, setUsers] = useState<UserProfileData[]>([])

    const onHandlerQuery = async () => {
        if (query.length === 0) {
            alert('請輸入欲搜尋之好友')
            return
        }
        const users = await queryUser(query)
        setUsers(users)
    }

    const onAdd = async (id: string) => {
        try {
            await addFriend(id)
            alert('已發送申請')
        } catch (err) {
            alert(err)

        }
    }

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.searchBar}
                placeholder="搜尋玩家名稱或 ID..."
                value={query}
                onChangeText={setQuery}
            />
            <Pressable onPress={onHandlerQuery}>
                <Text>查詢</Text>
            </Pressable>
            <FlatList
                data={users}
                renderItem={({ item }) =>
                    <FriendAddItem onAdd={(id) => onAdd(id)} user={item} />
                }
                keyExtractor={item => item.id}
            />
        </View>
    );
};
const styles = StyleSheet.create({
    container: { padding: 16 },
    searchBar: {
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        fontSize: 16,
    },
});
export default AddFriendTab;