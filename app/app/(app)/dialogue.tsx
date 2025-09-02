import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Button,
  Platform,
  ActivityIndicator,
  ImageBackground,
  TouchableOpacity,
  Image,
} from "react-native";
import * as FileSystem from "expo-file-system";
import {
  useAudioRecorder,
  RecordingConfig,
  ExpoAudioStreamModule,
} from "@siteed/expo-audio-studio";
import TrackPlayer, {
  State as TrackPlayerState,
  Event as TrackPlayerEvent,
  useTrackPlayerEvents,
} from "react-native-track-player";
import { io, Socket } from "socket.io-client";
import Rive, { RiveRef } from "rive-react-native";

// 在 App 檔案頂部註冊播放服務
TrackPlayer.registerPlaybackService(() => require("./service.js"));

// --- App Component ---
export default function App() {
  // --- 錄音相關 ---
  const { startRecording, stopRecording, isRecording } = useAudioRecorder();
  const audioChunksRef = useRef<string[]>([]);

  const riveRef = useRef<RiveRef>(null);

  // --- 狀態管理 ---
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>("正在連線到伺服器...");
  const [isConversationEnded, setIsConversationEnded] =
    useState<boolean>(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState<boolean>(false);

  const [isInitialized, setIsInitialized] = useState<boolean>(true);

  // --- Ref 管理 ---
  const socketRef = useRef<Socket | null>(null);
  const hasSentGreetingRef = useRef<boolean>(false);

  const SERVER_URL =
    Platform.OS === "android"
      ? "http://10.0.2.2:5010"
      : "https://61def6c3e8a3.ngrok-free.app";

  useEffect(() => {
    // 這個 effect 會監聽 isRecording 的變化
    console.log(`Rive: Syncing 'listening' state to: ${isRecording}`);
    riveRef.current?.setInputState("State Machine 1", "listening", isRecording);
  }, [isRecording]); // <--- 依賴項陣列中只有 isRecording

  // 【新增】Effect 2: 同步「AI 說話狀態」到 Rive
  useEffect(() => {
    // 這個 effect 會監聽 isAiSpeaking 的變化
    console.log(`Rive: Syncing 'talk' state to: ${isAiSpeaking}`);
    riveRef.current?.setInputState("State Machine 1", "talk", isAiSpeaking);
  }, [isAiSpeaking]);

  // --- Track Player 初始化設定 ---
  useEffect(() => {
    const setupPlayer = async () => {
      try {
        await TrackPlayer.setupPlayer();
        await TrackPlayer.updateOptions({
          capabilities: [],
          compactCapabilities: [],
        });
      } catch (error) {
        console.error("Error setting up Track Player:", error);
      }
    };
    setupPlayer();

    return () => {
      TrackPlayer.reset();
    };
  }, []);

  // --- WebSocket 連線與事件監聽 ---
  useEffect(() => {
    console.log("Setting up socket connection ONCE.");
    const socket = io(SERVER_URL);
    socketRef.current = socket;

    const onConnect = () => {
      console.log(`✅ Connected to WebSocket! My ID: ${socket.id}`);
      setIsConnected(true);
      setStatusText("已連線，等待 AI 開場白...");

      if (!hasSentGreetingRef.current) {
        const characterName = "Elara"; // 可替換為變數
        console.log(`🚀 Sending createConversation for name: ${characterName}`);
        socket.emit("createConversation", { name: characterName });
        hasSentGreetingRef.current = true;
      }
    };

    const onDisconnect = () => {
      console.log("🔌 Disconnected from WebSocket server.");
      setIsConnected(false);
      setStatusText("已從伺服器斷線");
    };

    const onAudioResponse = (audioChunk: string) => {
      if (audioChunk) {
        console.log("接收到音訊！");

        audioChunksRef.current.push(audioChunk);
      }
    };

    const onFinalResponse = (data: { text: string }) => {
      console.log(`🏁 Received FINAL text response: "${data.text}"`);
      // 更新狀態文字，顯示最後的回應
      setStatusText(data.text);
      // 將對話標記為已結束
      setIsConversationEnded(true);
      // 確保 AI 說話狀態結束
      setIsAiSpeaking(false);
    };

    const onEndAudioResponse = () => {
      console.log(
        "🏁 Received end of audio signal. Processing full response..."
      );

      const chunks = audioChunksRef.current;
      if (chunks.length === 0) {
        console.log("Chunks ref is empty, nothing to play.");
        if (hasSentGreetingRef.current && !isRecording) {
          setStatusText("輪到你了，請按鈕開始錄音");
        }
        return;
      }

      // 取得資料後，立刻清空 ref，為下一次對話做準備
      audioChunksRef.current = [];

      const playFullResponseFromFile = async (queue: string[]) => {
        try {
          console.log(
            `Concatenating and saving ${queue.length} audio chunks...`
          );
          const fullBase64 = queue.join("");
          const uri =
            FileSystem.cacheDirectory + `full_response_${Date.now()}.mp3`;
          console.log("uri:", uri);

          await FileSystem.writeAsStringAsync(uri, fullBase64, {
            encoding: FileSystem.EncodingType.Base64,
          });

          await TrackPlayer.reset();
          await TrackPlayer.add({
            url: uri,
            title: "AI Full Response",
            artist: "Assistant",
          });
          await TrackPlayer.play();
        } catch (error) {
          console.error("ERROR during final playback setup", error);
        }
      };

      playFullResponseFromFile(chunks);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("audioResponse", onAudioResponse);
    socket.on("endAudioResponse", onEndAudioResponse);
    socket.on("finalResponse", onFinalResponse);

    return () => {
      console.log("Cleaning up socket connection for ID:", socket.id);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("audioResponse", onAudioResponse);
      socket.off("endAudioResponse", onEndAudioResponse);
      socket.off("finalResponse", onFinalResponse);
      socket.disconnect();
    };
  }, []);

  // --- Hook: 監聽 Track Player 事件以更新 UI ---
  useTrackPlayerEvents(
    [TrackPlayerEvent.PlaybackState, TrackPlayerEvent.PlaybackError], // <-- 新增 Event.PlaybackError
    (event) => {
      if (event.type === TrackPlayerEvent.PlaybackState) {
        const isSpeaking =
          event.state === TrackPlayerState.Playing ||
          event.state === TrackPlayerState.Buffering;
        setIsAiSpeaking(isSpeaking);

        if (isSpeaking) {
          setStatusText("AI 正在說話...");
        } else {
          if (!isRecording && hasSentGreetingRef.current) {
            setStatusText("輪到你了，請按鈕開始錄音");
          }
        }
      }
    }
  );

  // --- 錄音控制函式 ---
  const handleStart = async () => {
    try {
      await ExpoAudioStreamModule.requestPermissionsAsync();
      setStatusText("正在聆聽...");

      const config: RecordingConfig = {
        interval: 250,
        sampleRate: 16000,
        channels: 1,
        encoding: "pcm_16bit",
        onAudioStream: async (audioData) => {
          if (socketRef.current?.connected && audioData.data) {
            socketRef.current.emit("audioStream", audioData.data);
          }
        },
        output: { primary: { enabled: false } },
      };
      await startRecording(config);
    } catch (error) {
      console.error("Failed to start recording:", error);
      setStatusText("錄音啟動失敗");
    }
  };

  const handleStop = async () => {
    await stopRecording();
    if (socketRef.current?.connected) {
      socketRef.current.emit("endAudioStream");
    }
    await TrackPlayer.reset(); // 強制停止並清空 AI 未說完的話
    setStatusText("AI 正在思考...");
  };

  // --- UI 渲染 ---
  const renderLoadingScreen = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#FFFFFF" />
      <Text style={styles.loadingText}>INITIALIZING...</Text>
    </View>
  );

  const renderisFinishScreen = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#FFFFFF" />
      <Text style={styles.loadingText}>對話已經結束</Text>
    </View>
  );

  // --- 對話介面 ---
  const renderChatScreen = () => (
    <ImageBackground
      source={require("@/assets/images/Dialogue/bg.png")}
      resizeMode="cover"
      style={styles.chatContainer}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.characterContainer}>
          <Rive
            ref={riveRef}
            url="https://mou-english.s3.ap-northeast-1.amazonaws.com/Anna.riv"
            artboardName="iPhone 16 - 1"
            stateMachineName="State Machine 1"
            autoplay={true}
            style={styles.rive}
          />
          <Image
            source={require("@/assets/images/Dialogue/fg.png")}
            style={styles.overlayImage}
          />
        </View>

        {/* 錄音按鈕 */}
        <TouchableOpacity
          style={[
            styles.recordButton,
            (isRecording || isAiSpeaking) && styles.recordButtonDisabled, // 錄音或 AI 說話時，按鈕變半透明
            isRecording && styles.recordButtonActive, // 錄音時，按鈕加個外框
          ]}
          onPress={isRecording ? handleStop : handleStart}
          disabled={!isConnected || isAiSpeaking} // AI 說話時完全禁用按鈕
        >
          <Image
            source={require("@/assets/images/Dialogue/fg.png")}
            style={styles.micIcon}
          />
        </TouchableOpacity>
      </SafeAreaView>
    </ImageBackground>
  );

  return isInitialized
    ? isConversationEnded
      ? renderisFinishScreen()
      : renderChatScreen()
    : renderLoadingScreen();
}

// --- 樣式 ---
const styles = StyleSheet.create({
  // --- 載入介面樣式 ---
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1c1c1e", // 深色背景
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  // --- 對話介面樣式 ---
  chatContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // --- 人物相關樣式 ---
  characterContainer: {
    // 使用絕對定位讓容器疊在背景圖上，並佔滿全螢幕
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    marginTop: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  characterImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  overlayImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
    position: "absolute",
    marginTop: 200,
  },

  // --- 錄音按鈕樣式 ---
  recordButton: {
    position: "absolute",
    bottom: 60, // 距離底部 60px
    width: 80,
    height: 80,
    borderRadius: 40, // 圓形
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  recordButtonActive: {
    // 正在錄音時的樣式，例如發光的紅色外框
    borderColor: "#ff453a",
    backgroundColor: "rgba(255, 69, 58, 0.4)",
  },
  recordButtonDisabled: {
    opacity: 0.5, // 禁用時變半透明
  },
  rive: {
    width: 400,
    height: 400,
  },
  micIcon: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
});
