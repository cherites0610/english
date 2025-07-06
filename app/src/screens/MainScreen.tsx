import React, { useState } from 'react';
import { View, StyleSheet, Text, Button, Image } from 'react-native';
import Header from '../components/Header'; // 匯入 Header
import CustomModal, { ButtonConfig } from '../components/CustomModal';
import Bubble from '../components/Bubble';

const Icon = ({ name, size }: { name: string, size: number }) => (
  <View style={{ width: size, height: size, backgroundColor: '#ddd', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: size * 0.6, color: '#555' }}>{name.charAt(0)}</Text>
  </View>
);

export default function MainScreen() {
  const [isModalVisible, setModalVisible] = useState(false);

  const handleOpenModal = () => {
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const modalButtons: ButtonConfig[] = [
    {
      text: '取消',
      onPress: handleCloseModal,
      style: 'secondary',
    },
    {
      text: '確認',
      onPress: () => {
        console.log('已確認！');
        handleCloseModal();
      },
      style: 'primary',
    },
  ];

  return (
    <View style={styles.screen}>
      <Header
        variant="main"
        avatarUrl="https://i.pravatar.cc/150?u=a042581f4e29026704d" // 替換成真實的頭像 URL
        name="程式夥伴"
        userLevel={99}
        money={123456}
      />

      <Button title="打開彈出視窗" onPress={handleOpenModal} />

      <View>
        <Text>Bubble 元件範例</Text>

        <View style={styles.showcaseRow}>
          <View style={styles.item}>
            <Bubble mode="count" count={7}>
              <Icon name="Tasks" size={60} />
            </Bubble>
            <Text style={styles.label}>數字模式</Text>
          </View>

          <View style={styles.item}>
            <Bubble
              mode="image"
              imageUrl="https://i.pravatar.cc/100?img=5"
              size={20}
            >
              <Icon name="Avatar" size={60} />
            </Bubble>
            <Text style={styles.label}>圖片模式</Text>
          </View>

          <View style={styles.item}>
            <Bubble mode="count" count={120}>
              <Icon name="Mail" size={60} />
            </Bubble>
            <Text style={styles.label}>超過99</Text>
          </View>

          <View style={styles.item}>
            <Bubble mode="count" count={5} offsetX={5} offsetY={5}>
              <Icon name="Adjust" size={60} />
            </Bubble>
            <Text style={styles.label}>位置微調</Text>
          </View>

        </View>
      </View>

      <CustomModal
        isVisible={isModalVisible}
        onClose={handleCloseModal}
        title="提示"
        buttons={modalButtons}
        closeOnBackdropPress={false}
        showCloseButton={true}
      >
        <View style={styles.modalContent}>
          <Image
            source={{ uri: 'https://img.icons8.com/cute-clipart/64/ok.png' }}
            style={styles.modalImage}
          />
          <Text style={styles.modalText}>
            這是透過 children 傳入的自訂內容。
          </Text>
        </View>
      </CustomModal>
    </View>

  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    alignItems: 'center',
  },
  modalImage: {
    width: 64,
    height: 64,
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
  },
  showcaseRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
    gap: 20,
    flexWrap: 'wrap'
  },
  item: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#333',
  }
});