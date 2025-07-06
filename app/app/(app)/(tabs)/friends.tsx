import BottomNavBar from '@/src/components/BottomNavBar';
import AddFriendTab from '@/src/components/friends/AddFriendTab';
import FriendRequestsTab from '@/src/components/friends/FriendRequestsTab';
import FriendsListTab from '@/src/components/friends/FriendsListTab';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';

type ActiveTab = 'list' | 'requests' | 'add';

const TabButton = ({ label, isActive, onPress }: { label: string, isActive: boolean, onPress: () => void }) => (
  <TouchableOpacity style={[styles.tabButton, isActive && styles.activeTabButton]} onPress={onPress}>
    <Text style={[styles.tabText, isActive && styles.activeTabText]}>{label}</Text>
  </TouchableOpacity>
);

export default function FriendsScreen() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('list');

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={{ fontSize: 30, fontStyle: 'italic', textAlign: 'center', marginTop: 10, marginBottom: 20 }}>好友</Text>
      <View style={styles.tabContainer}>
        <TabButton label="好友列表" isActive={activeTab === 'list'} onPress={() => setActiveTab('list')} />
        <TabButton label="好友確認" isActive={activeTab === 'requests'} onPress={() => setActiveTab('requests')} />
        <TabButton label="新增好友" isActive={activeTab === 'add'} onPress={() => setActiveTab('add')} />
      </View>
      <View style={styles.content}>
        {activeTab === 'list' && <FriendsListTab />}
        {activeTab === 'requests' && <FriendRequestsTab />}
        {activeTab === 'add' && <AddFriendTab />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F0F2F5' },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: 'white',
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  activeTabButton: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  activeTabText: {
    color: 'white',
  },
  content: {
    flex: 1,
  },
});