import { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ImageBackground, Image, Pressable, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import Header from '@/src/components/Header';
import WaveformPlaceholder from '@/src/components/WaveformPlaceholder';
import { addMessage, createTalkByCategoryName } from '@/src/services/talkService';
import { useAudioRecording } from '@/src/hooks/useAudioRecording';
import { Audio } from 'expo-av';
import Rive, { RiveRef } from 'rive-react-native';

// Message 介面維持不變
interface message {
    uri: string,
    content: string,
    role: 'ASSISTANT' | 'USER',
    timestamp: number
}

export default function DialogueScreen() {
    const { houseTitle } = useLocalSearchParams<{ houseTitle: string }>();
    const router = useRouter();

    // --- State 管理 ---
    const talkTimerRef = useRef<NodeJS.Timeout | null>(null);
    const riveRef = useRef<RiveRef>(null);
    const [talkID, setTalkID] = useState<string>('');
    const [messages, setMessages] = useState<message[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const [sound, setSound] = useState<Audio.Sound>(); // 新增：用來存放 sound 物件
    const [currentPlayingUri, setCurrentPlayingUri] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false); // 新增：追蹤播放狀態
    const [isInitializing, setIsInitializing] = useState(true);

    const [isListening, setIsListening] = useState(false);
    const [isTalking, setIsTalking] = useState(false);

    const setRiveListenState = (value: boolean) => {
        setIsListening(value);
        riveRef.current?.setInputState("State Machine 1", "listening", value);
        console.log(`Rive 'listening' state set to: ${value}`);
    };

    const setRiveTalkState = (value: boolean) => {
        if (talkTimerRef.current) {
            clearTimeout(talkTimerRef.current);
            talkTimerRef.current = null;
        }
        setIsTalking(value);
        riveRef.current?.setInputState("State Machine 1", "talk", value);
        console.log(`Rive 'talk' state set to: ${value} at ${new Date().toISOString()}`);
    };

    const { recorderState, startRecording, stopRecording } = useAudioRecording();

    const messagesRef = useRef(messages);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    const playableMessages = messages.filter(m => m.uri && m.uri.startsWith('file://'));
    const lastMessage = playableMessages[playableMessages.length - 1];
    const secondLastMessage = playableMessages[playableMessages.length - 2];

    const playAudioFromUri = async (uri: string | null) => {
        if (!uri) return;

        // 如果點擊的是正在播放的音訊，則暫停/播放
        if (sound && currentPlayingUri === uri) {
            if (isPlaying) {
                await sound.pauseAsync();
                setIsPlaying(false);
            } else {
                await sound.playAsync();
                setIsPlaying(true);
            }
            return;
        }

        // 如果目前有音訊正在播放或已載入，先卸載它
        if (sound) {
            await sound.unloadAsync();
        }

        console.log('Loading Sound from:', uri);
        try {
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri },
                { shouldPlay: true }, // 載入後立即播放
                (status) => { // 播放狀態更新時的回呼
                    if (status.isLoaded) {
                        setIsPlaying(status.isPlaying);
                        setRiveTalkState(status.isPlaying);
                        if (status.didJustFinish) {
                            // 播放剛剛結束
                            setCurrentPlayingUri(null);

                            // 1. 計算距離下一個 "整秒" 還需要多少毫秒
                            const now = new Date();
                            const milliseconds = now.getMilliseconds();
                            const delay = 1000 - milliseconds;

                            console.log(`音訊播放完畢。將在 ${delay} 毫秒後，於下一個整秒切換 talk 狀態為 false。`);

                            // 2. 設定一個計時器，在精確的時間點執行
                            talkTimerRef.current = setTimeout(() => {
                                // 執行後清除 ref
                                talkTimerRef.current = null;
                                // 這裡只設定 Rive 的狀態，UI 的 isPlaying 狀態已經是 false
                                setIsTalking(false);
                                riveRef.current?.setInputState("State Machine 1", "talk", false);
                                console.log(`Rive 'talk' state set to: false at ${new Date().toISOString()}`);
                            }, delay);

                        } else {
                            // 處理播放、暫停、手動跳轉等其他情況
                            // 讓 talk 狀態與實際播放狀態同步
                            setRiveTalkState(status.isPlaying);
                        }
                    }
                }
            );
            setSound(newSound);
            setCurrentPlayingUri(uri);
            setIsPlaying(true);
        } catch (error) {
            console.error("載入音訊時發生錯誤:", error);
        }
    };

    useEffect(() => {
        return sound
            ? () => {
                console.log('Unloading Sound');
                sound.unloadAsync();
            }
            : undefined;
    }, [sound]);

    // 初始載入對話
    useEffect(() => {
        const loadAndPrepareAudio = async () => {
            if (!houseTitle) {
                setIsInitializing(false);
                return
            };

            try {
                const result = await createTalkByCategoryName(houseTitle); // 使用 houseTitle

                if (result?.message?.audioBase64) {
                    const path = `${FileSystem.cacheDirectory}npc-talk-${Date.now()}.mp3`;
                    await FileSystem.writeAsStringAsync(path, result.message.audioBase64, {
                        encoding: FileSystem.EncodingType.Base64,
                    });

                    setTalkID(result.talkID);
                    const newMessage: message = {
                        uri: path,
                        content: result.message.content,
                        role: result.message.role,
                        timestamp: Date.now()
                    };
                    setMessages([newMessage]); // 初始訊息，直接設定

                    // 自動播放初始訊息
                    playAudioFromUri(path);
                }
            } catch (error) {
                console.error("載入初始音訊時發生錯誤:", error);
            } finally {
                setIsInitializing(false)
            }
        };
        loadAndPrepareAudio();
    }, [houseTitle]);

    async function handleUploadRecording(uri: string) {
        if (!uri || !talkID) return;
        const uploadTimestamp = Date.now();
        setIsUploading(true);
        try {

            const formData = new FormData();

            // 根據後端 FileInterceptor('audio') 的設定，欄位名稱必須是 'audio'
            formData.append('audio', {
                uri: uri,
                name: `recording-${uploadTimestamp}.m4a`, // 提供一個檔名
                type: 'audio/m4a', // 指定檔案的 MIME 類型
            } as any);

            console.log(`準備上傳錄音... TalkID: ${talkID}`);

            // 步驟 2: 呼叫 API
            // result 的型別應該要根據你的後端回傳值來定義，這裡我們先假設它包含 userMessage 和 assistantMessage
            const result = await addMessage(talkID, formData);

            // 如果沒有成功的回應，就直接返回
            if (!result) {
                throw new Error("API 沒有回傳有效的結果");
            }

            const messagesToAdd: message[] = [];

            if (result.userMessage) {
                messagesToAdd.push({
                    uri: uri, // 使用者錄音的本地 URI
                    content: result.userMessage.content,
                    role: 'USER',
                    timestamp: uploadTimestamp
                });
            }


            if (result.assistantMessage?.audioBase64) {
                const path = `${FileSystem.cacheDirectory}npc-talk-${Date.now()}.mp3`;
                await FileSystem.writeAsStringAsync(path, result.assistantMessage.audioBase64, {
                    encoding: FileSystem.EncodingType.Base64,
                });

                messagesToAdd.push({
                    uri: path, // AI 回覆的音訊本地 URI
                    content: result.assistantMessage.content,
                    role: 'ASSISTANT',
                    timestamp: Date.now()
                });

                // 步驟 5: 自動播放新的 AI 回覆
                playAudioFromUri(path);
            }

            setMessages(prev => [...prev, ...messagesToAdd]);


        } catch (error) {
            console.error("上傳或處理錄音失敗:", error);
            // 你可以在這裡加入錯誤處理的 UI 提示，例如 Toast 或 Alert
        } finally {
            setIsUploading(false);
        }
    }

    const handleRecordButtonPress = () => {
        console.log(recorderState.isRecording);

        if (recorderState.isRecording) {
            // 停止錄音
            stopRecording();
            setRiveListenState(false);
        } else {
            // 開始錄音
            startRecording();
            setRiveListenState(true);
        }
    };

    useEffect(() => {
        if (recorderState.url) {
            handleUploadRecording(recorderState.url);
        }
    }, [recorderState.url]);

    useEffect(() => {
        return () => {
            const cleanupFiles = async () => {
                const allUris = messagesRef.current.map(m => m.uri).filter(Boolean);

                console.log(`準備刪除 ${allUris.length} 個檔案...`);

                for (const uri of allUris) {
                    try {
                        const fileInfo = await FileSystem.getInfoAsync(uri);
                        if (fileInfo.exists) {
                            await FileSystem.deleteAsync(uri, { idempotent: true });
                            console.log(`已成功刪除快取檔案: ${uri}`);
                        }
                    } catch (error) {
                        console.error(`刪除檔案 ${uri} 時發生錯誤:`, error);
                    }
                }
            };
            cleanupFiles();
            if (talkTimerRef.current) {
                clearTimeout(talkTimerRef.current);
            }
        };
    }, []);

    const getPlayIcon = (uri: string | undefined) => {
        if (!uri) return 'play';
        return isPlaying && currentPlayingUri === uri ? 'pause' : 'play';
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            {/* <Header variant="game" title={houseTitle} onBackPress={() => router.back()} /> */}
            {isInitializing ? (
                <LoadingAnimationA />
            ) : (
                // [修改] 使用一個 View 包裹所有需要疊加的元素
                <View style={styles.mainContainer}>
                    {/* 1. 背景圖片 (最底層) */}
                    <ImageBackground
                        source={require('@/assets/images/Dialogue/bg.png')}
                        style={styles.backgroundImage}
                        resizeMode="cover"
                    >
                        {/* 2. Rive 動畫 (中間層) */}
                        <View style={styles.riveContainer}>
                            <Rive
                                ref={riveRef}
                                url="https://mou-english.s3.ap-northeast-1.amazonaws.com/Anna.riv"
                                artboardName="iPhone 16 - 1"
                                stateMachineName="State Machine 1"
                                autoplay={true}
                                style={styles.rive}
                            />
                        </View>
                    </ImageBackground>

                    {/* 3. 您要加入的頂部圖片 (最上層) */}
                    <Image
                        source={require('@/assets/images/Dialogue/fg.png')}
                        style={styles.topOverlayImage}
                        resizeMode="cover"
                    />

                    {/* 底部的控制元件，為了確保它們在最上層，可以放在這個 View 之外 */}
                    <View style={styles.bottomContainer}>
                        <WaveformPlaceholder />
                        <View style={styles.bottomControlsContainer}>
                            <Pressable
                                onPress={() => playAudioFromUri(secondLastMessage?.uri)}
                                disabled={!secondLastMessage || isUploading}
                                style={[styles.smallButton, (!secondLastMessage || isUploading) && styles.disabledButton]}
                            >
                                <Ionicons name="play-skip-back" size={32} color="white" />
                            </Pressable>
                            <Pressable
                                onPress={handleRecordButtonPress}
                                disabled={isUploading}
                                style={[styles.recordButton, (recorderState.isRecording || isUploading) && styles.recordButtonActive]}
                            >
                                <Ionicons name="mic" size={50} color="white" />
                            </Pressable>
                            <Pressable
                                onPress={() => playAudioFromUri(lastMessage?.uri)}
                                disabled={!lastMessage || isUploading}
                                style={[styles.smallButton, (!lastMessage || isUploading) && styles.disabledButton]}
                            >
                                <Ionicons name={getPlayIcon(lastMessage?.uri)} size={32} color="white" />
                            </Pressable>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
}

const LoadingAnimationA = () => (
    <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>正在建立對話，請稍候...</Text>
    </View>
);

// --- 樣式表 ---
const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
    },
    backgroundImage: {
        flex: 1, // 讓背景圖片佔滿整個容器
    },
    riveContainer: {
        flex: 1, // 讓 Rive 容器也佔滿，以便在背景上疊加
        marginTop:100,
        justifyContent: 'center', // 可以根據需要調整 Rive 的垂直位置
        alignItems: 'center',   // 可以根據需要調整 Rive 的水平位置
    },
    topOverlayImage: {
        // [修改] 使用絕對定位將圖片疊加到最上層
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        resizeMode: 'contain', // 根據需要調整
        zIndex: 10, // 確保圖片在其他元素之上
        // 可以根據需要添加額外的 margin、padding 或調整位置
    },
    screen: {
        flex: 1,
        justifyContent: 'flex-end', // 讓內容靠底
    },
    characterContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    characterImage: {
        width: '80%',
        height: '80%',
        resizeMode: 'contain',
    },
    bottomContainer: {
        paddingBottom: 40,
        paddingHorizontal: 20,
        zIndex:10000
    },
    bottomControlsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginTop: 20,
    },
    recordButton: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#E91E63', // 醒目的粉紅色
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    recordButtonActive: {
        backgroundColor: '#C2185B', // 按下或處理中時的深色
    },
    smallButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.5,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a1a', // 給一個深色背景
    },
    loadingText: {
        color: 'white',
        marginTop: 15,
        fontSize: 16,
    },
    rive: {
        width: 400,
        height: 400,
    },
});