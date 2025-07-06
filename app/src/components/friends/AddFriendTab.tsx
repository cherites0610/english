import React, { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

const AddFriendTab = () => {
    const [query, setQuery] = useState('');
    return (
        <View style={styles.container}>
            <TextInput
                style={styles.searchBar}
                placeholder="搜尋玩家名稱或 ID..."
                value={query}
                onChangeText={setQuery}
            />
            {/* 搜尋結果列表將會顯示在這裡 */}
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