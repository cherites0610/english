import Header from '@/src/components/Header';
import HouseLayout from '@/src/components/HouseLayout';
import MailModal from '@/src/components/MailModal';
import NpcLayout from '@/src/components/NpcLayout';
import ProfileModal from '@/src/components/ProfileModal';
import SettingsModal from '@/src/components/SettingsModal';
import SideActionBar, { ActionItemConfig } from '@/src/components/SideActionBar';
import { TaskBriefingModal } from '@/src/components/TaskBriefingModal';
import TaskModal from '@/src/components/TaskModal';
import { useUserProfile } from '@/src/hooks/useUserProfile';
import { displayedNpcs, NpcData, TaskBriefing } from '@/src/services/gameService';
import { fetchUserProfile } from '@/src/services/userService';
import { UserProfileData } from '@/src/types';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ImageBackground, ImageSourcePropType, SafeAreaView, StyleSheet, View, Text } from 'react-native';

type HouseData = {
  id: string;
  title: string;
  imageUrl: ImageSourcePropType;
};

export default function HomeScreen() {
  const router = useRouter();

  const [selectedTask, setSelectedTask] = useState<TaskBriefing | null>(null);

  const [isMailModalVisible, setMailModalVisible] = useState(false);
  const [isSettingsModalVisible, setSettingsModalVisible] = useState(false);
  const [isTaskModalVisible, setTaskModalVisible] = useState(false);
  const [isProfileModalVisible, setProfileModalVisible] = useState(false);
  const [isTaskBriefingModalVisible, setTaskBriefingModalVisible] = useState(false);

  const [taskCount, setTaskCount] = useState(5);
  const [mailCount, setMailCount] = useState(12);

  const { userProfile, isLoading, error } = useUserProfile();

  const handleActionPress = (id: string) => {
    if (id === 'mail') {
      setMailModalVisible(true);
    } else if (id === 'settings') {
      setSettingsModalVisible(true);
    } else if (id === 'tasks') {
      setTaskModalVisible(true);
    } else {
      Alert.alert('按鈕點擊', `你點擊了 "${id}" 按鈕`);
    }
  };

  const handleHousePress = (houseId: string) => {
    router.push('/house-menu');
  };

  const handleNpcPress = (npc: NpcData) => {
    if (npc.task) {
      setSelectedTask(npc.task);
      setTaskBriefingModalVisible(true);
    } else {
      Alert.alert('NPC 點擊', `你和 "${npc.id}" 開始了對話`);
    }
  };

  const handleStartTask = () => {
    setTaskBriefingModalVisible(false);
    // 這裡可以傳遞任務 ID 或其他資訊到對話頁面
    router.push({
      pathname: '/dialogue',
      params: { taskTitle: selectedTask?.title || '任務' },
    });
    setSelectedTask(null);
  };

  const handleAvatarPress = () => setProfileModalVisible(true);

  const houseData: HouseData[] = [
    { id: 'house1', title: '主屋', imageUrl: require('@/assets/images/MainScreen/house1.png') },
    { id: 'house2', title: '工坊', imageUrl: require('@/assets/images/MainScreen/house2.png') },
    { id: 'house3', title: '農場', imageUrl: require('@/assets/images/MainScreen/house3.png') },
    { id: 'house4', title: '礦場', imageUrl: require('@/assets/images/MainScreen/house4.png') },
    { id: 'house5', title: '碼頭', imageUrl: require('@/assets/images/MainScreen/house5.png') },
  ];

  const actionBarItems: ActionItemConfig[] = [
    {
      id: 'tasks',
      iconName: 'checkbox-outline',
      onPress: handleActionPress,
      bubbleCount: taskCount,
    },
    {
      id: 'mail',
      iconName: 'mail-outline',
      onPress: handleActionPress,
      bubbleCount: mailCount,
    },
    {
      id: 'settings',
      iconName: 'settings-outline',
      onPress: handleActionPress,
    },
  ];

  if (isLoading) {
    return (
      <View style={{ flex: 1 }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !userProfile) {
    return (
      <View style={{ flex: 1 }}>
        <Text style={{ color: 'red' }}>{error || '無法載入資料'}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.screen}>
        <Header
          variant="main"
          avatarUrl={userProfile.avatarUrl}
          name={userProfile.name}
          userLevel={userProfile.userLevel}
          money={userProfile.money}
          onAvatarPress={handleAvatarPress}
        />
        <ImageBackground
          resizeMode='stretch'
          style={{ flex: 1 }}
          source={require('@/assets/images/MainScreen/background.png')}
        >
          <SideActionBar actionItems={actionBarItems} />
          <HouseLayout houses={houseData} onHousePress={handleHousePress} verticalOffset={-50} horizontalOffset={-40} />
          <NpcLayout npcs={displayedNpcs} onNpcPress={handleNpcPress} />

          <TaskModal
            isVisible={isTaskModalVisible}
            onClose={() => setTaskModalVisible(false)}
          />
          <MailModal
            isVisible={isMailModalVisible}
            onClose={() => setMailModalVisible(false)}
          />
          <SettingsModal
            isVisible={isSettingsModalVisible}
            onClose={() => setSettingsModalVisible(false)}
          />
          <ProfileModal
            isVisible={isProfileModalVisible}
            onClose={() => setProfileModalVisible(false)}
            userData={userProfile} // ✨ 傳遞資料
          />
          <TaskBriefingModal
            isVisible={isTaskBriefingModalVisible}
            onClose={() => setTaskBriefingModalVisible(false)}
            onStart={handleStartTask}
            taskData={selectedTask}
          />
        </ImageBackground>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  modalContent: { height: 400, width: '100%' },
});