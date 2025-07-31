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
    const [talkID, setTalkID] = useState<string>('');
    const [messages, setMessages] = useState<message[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const [sound, setSound] = useState<Audio.Sound>(); // 新增：用來存放 sound 物件
    const [currentPlayingUri, setCurrentPlayingUri] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false); // 新增：追蹤播放狀態
    const [isInitializing, setIsInitializing] = useState(true);

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

        console.log('Loading Sound from:', uri);
        try {
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri },
                { shouldPlay: true }, // 載入後立即播放
                (status) => { // 播放狀態更新時的回呼
                    if (status.isLoaded) {
                        setIsPlaying(status.isPlaying);
                        if (status.didJustFinish) {
                            // 音訊播放完畢
                            setIsPlaying(false);
                            setCurrentPlayingUri(null);
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
                console.log(1);
                const result = await createTalkByCategoryName(houseTitle); // 使用 houseTitle
                console.log(2);

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
        };
    }, []);

    const getPlayIcon = (uri: string | undefined) => {
        if (!uri) return 'play';
        return isPlaying && currentPlayingUri === uri ? 'pause' : 'play';
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            <Header variant="game" title={houseTitle} onBackPress={() => router.back()} />
            {isInitializing ? (
                // 需求二：顯示初始載入動畫 A
                <LoadingAnimationA />
            ) : (
                <>
                    <ImageBackground
                        source={require('@/assets/images/Dialogue/background.png')}
                        style={styles.screen}
                        resizeMode="cover"
                    >
                        <View style={styles.characterContainer}>
                            <Image
                                source={require('@/assets/images/Dialogue/npc_full_body.png')}
                                style={styles.characterImage}
                            />
                        </View>
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
                                    onPress={recorderState.isRecording ? stopRecording : startRecording}
                                    disabled={isUploading}
                                    style={[styles.recordButton, (recorderState.isRecording || isUploading) && styles.recordButtonActive]}
                                >
                                    {/* 維持原樣，因為全螢幕的載入動畫 B 會覆蓋它 */}
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
                    </ImageBackground>
                </>
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
});