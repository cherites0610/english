import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TaskBriefing } from "../services/gameService";

type TaskBriefingModalProps = {
  isVisible: boolean;
  taskData?: TaskBriefing | null;
  onClose: () => void;
  onStart: () => void;
};

export const TaskBriefingModal: React.FC<TaskBriefingModalProps> = ({
  isVisible,
  taskData,
  onClose,
  onStart,
}) => {
  if (!taskData) return null;

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <Text style={styles.title}>{taskData.title}</Text>
          <ScrollView style={styles.contentScrollView}>
            <Text style={styles.content}>{taskData.content}</Text>
          </ScrollView>
          <View style={styles.rewardsSection}>
            <Text style={styles.rewardsTitle}>預期獎勵</Text>
            <View style={styles.rewardsContainer}>
              {taskData.rewards.map((reward) => (
                <View key={reward.name} style={styles.rewardItem}>
                  <Ionicons name={reward.icon} size={24} color="#F59E0B" />
                  <Text style={styles.rewardText}>
                    {reward.name} x{reward.amount}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          <Image
            source={taskData.characterImage}
            style={styles.characterImage}
          />
          <TouchableOpacity style={styles.startButton} onPress={onStart}>
            <Text style={styles.startButtonText}>開始任務</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "90%",
    maxHeight: "70%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    paddingBottom: 80, // 為底部按鈕和人物圖留出空間
    position: "relative",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  contentScrollView: {
    maxHeight: 150,
    marginBottom: 20,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: "#374151",
  },
  rewardsSection: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 16,
  },
  rewardsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  rewardsContainer: {
    flexDirection: "row",
    gap: 16,
  },
  rewardItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rewardText: {
    fontSize: 14,
    color: "#4B5563",
  },
  characterImage: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 100,
    height: 120,
    resizeMode: "contain",
  },
  startButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "#10B981",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  startButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
