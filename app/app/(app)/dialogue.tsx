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
import { io, Socket } from 'socket.io-client';
import { useUserProfile } from '@/src/hooks/useUserProfile';
import { Buffer } from 'buffer';

// Message 介面維持不變
interface message {
    uri?: string,
    content: string,
    role: 'ASSISTANT' | 'USER',
    timestamp: number
}

export default function DialogueScreen() {
    const { houseTitle } = useLocalSearchParams<{ houseTitle: string }>();
    const { userProfile: user } = useUserProfile()

    // --- State 管理 ---
    const riveRef = useRef<RiveRef>(null);
    const [talkID, setTalkID] = useState<string>('');
    const [messages, setMessages] = useState<message[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);

    const { recorderState, startRecording, stopRecording } = useAudioRecording();

    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [currentPlayingUri, setCurrentPlayingUri] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackQueue, setPlaybackQueue] = useState<string[]>([]); // 新增：音訊播放佇列
    const isPlayingRef = useRef(isPlaying); // 新增：用 Ref 同步 isPlaying 狀態
    isPlayingRef.current = isPlaying;

    const isLoadingSound = useRef(false);

    const socketRef = useRef<Socket | null>(null);

    // [修改] Rive 動畫狀態控制 (邏輯簡化)
    const setRiveListenState = (value: boolean) => riveRef.current?.setInputState("State Machine 1", "listening", value);
    const setRiveTalkState = (value: boolean) => riveRef.current?.setInputState("State Machine 1", "talk", value);

    useEffect(() => {
        // 連接 Socket
        socketRef.current = io('http://localhost:5010', { transports: ['websocket'] });
        const socket = socketRef.current;

        socket.on('connect', () => console.log('Socket connected!'));
        socket.on('disconnect', () => console.log('Socket disconnected.'));
        socket.on('stream-error', (err) => {
            console.error('Stream error:', err);
            setIsUploading(false); // 發生錯誤時停止 loading
        });

        // 監聽 AI 回傳的文字片段
        socket.on('ai-text-chunk', (textChunk: string) => {
            setMessages(prev => {
                const lastMessage = prev[prev.length - 1];
                if (lastMessage && lastMessage.role === 'ASSISTANT') {
                    lastMessage.content += textChunk;
                    return [...prev];
                }
                return prev;
            });
        });

        // 監聽 AI 回傳的音訊片段
        socket.on('audio-chunk', async (chunk: ArrayBuffer) => {
            try {
                // 將收到的音訊塊存為暫存檔
                const path = `${FileSystem.cacheDirectory}ai-chunk-${Date.now()}.mp3`;
                const base64Chunk = Buffer.from(chunk).toString('base64');
                await FileSystem.writeAsStringAsync(path, base64Chunk, {
                    encoding: FileSystem.EncodingType.Base64,
                });
                // 將檔案路徑加入播放佇列
                setPlaybackQueue(prev => [...prev, path]);
            } catch (error) {
                console.error("處理音訊 chunk 失敗:", error);
            }
        });

        socket.on('stream-end', () => {
            console.log('AI stream ended.');
            setIsUploading(false);
        });

        // 組件卸載時斷開連接
        return () => {
            socket.disconnect();
            // ... 其他清理邏輯 ...
        };
    }, []);

    const playNextInQueue = async () => {
        if (playbackQueue.length === 0 || isPlayingRef.current || isLoadingSound.current) {
            if (playbackQueue.length === 0) setRiveTalkState(false);
            return;
        }

        isLoadingSound.current = true;

        const uriToPlay = playbackQueue[0];
        console.log('Playing next in queue:', uriToPlay);

        // 如果目前有 sound 物件，先卸載
        if (sound) {
            await sound.unloadAsync();
        }

        try {
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: uriToPlay },
                { shouldPlay: true },
                (status) => {
                    if (status.isLoaded) {
                        setIsPlaying(status.isPlaying);
                        setRiveTalkState(status.isPlaying);
                        if (status.didJustFinish) {
                            // 播放完畢，從佇列中移除，並觸發播放下一個
                            setPlaybackQueue(prev => prev.slice(1));
                        }
                    }
                }
            );
            setSound(newSound);
            setCurrentPlayingUri(uriToPlay);
        } catch (error) {
            console.error("載入或播放音訊佇列失敗:", error);
            // 即使出錯也嘗試播放下一個
            setPlaybackQueue(prev => prev.slice(1));
        } finally {
            isLoadingSound.current = false;
        }
    };

    // 監聽佇列變化，觸發播放
    useEffect(() => {
        playNextInQueue();
    }, [playbackQueue]);

    // 初始載入對話 (邏輯基本不變)
    useEffect(() => {
        const loadInitialTalk = async () => {
            if (!houseTitle) return setIsInitializing(false);
            try {
                const result = await createTalkByCategoryName(houseTitle);
                if (result?.message?.audioBase64) {
                    const path = `${FileSystem.cacheDirectory}npc-talk-${Date.now()}.mp3`;
                    await FileSystem.writeAsStringAsync(path, result.message.audioBase64, {
                        encoding: FileSystem.EncodingType.Base64,
                    });
                    setTalkID(result.talkID);
                    setMessages([{
                        uri: path,
                        content: result.message.content,
                        role: 'ASSISTANT',
                        timestamp: Date.now()
                    }]);
                    setPlaybackQueue(prev => [...prev, path]); // 加入佇列自動播放
                }
            } catch (error) {
                console.error("載入初始音訊失敗:", error);
            } finally {
                setIsInitializing(false);
            }
        };
        loadInitialTalk();
    }, [houseTitle]);

    const streamRecordingToServer = async (uri: string) => {
        if (!uri || !talkID) return;
        const socket = socketRef.current;
        if (!socket) return console.error("Socket not connected.");

        setIsUploading(true); // 開始等待 AI 回應

        // 1. 通知後端開始對話
        socket.emit('start-talk', { userID: user?.id, talkID });

        // 2. 將使用者訊息加入歷史紀錄
        setMessages(prev => [...prev, {
            content: '',
            role: 'USER',
            timestamp: Date.now()
        }]);

        const fileInfo = await FileSystem.getInfoAsync(uri);

        if (!fileInfo.exists) {
            console.error("Recording file does not exist, cannot stream:", uri);
            setIsUploading(false); // 記得重設 loading 狀態
            return;
        }

        // 在這個檢查之後，TypeScript 就知道 fileInfo 包含 size 屬性
        const CHUNK_SIZE = 4096;
        let position = 0;
        let keepReading = true;

        console.log(`Starting to stream file of size: ${fileInfo.size}`);

        while (keepReading) {
            try {
                const chunk = await FileSystem.readAsStringAsync(uri, {
                    encoding: FileSystem.EncodingType.Base64,
                    position: position,
                    length: CHUNK_SIZE,
                });

                if (chunk.length > 0) {
                    // 如果讀到了內容，就發送
                    // console.log(`Sending chunk from position: ${position}, size: ${chunk.length}`);
                    socket.emit('audio-chunk', Buffer.from(chunk, 'base64'));
                    position += CHUNK_SIZE; // 更新下一次讀取的位置
                } else {
                    // 如果讀到的是空字串，代表檔案已經讀完
                    console.log("End of file reached.");
                    keepReading = false;
                }
            } catch (error) {
                console.error("Error reading file chunk:", error);
                keepReading = false;
            }
        }

        // 4. 通知後端音訊發送完畢
        socket.emit('end-audio');
        console.log('Finished streaming recording to server.');
    };

    // 監聽錄音狀態，結束後觸發串流上傳
    useEffect(() => {
        if (recorderState.url) {
            streamRecordingToServer(recorderState.url);
        }
    }, [recorderState.url]);


    // --- 按鈕事件處理 (邏輯簡化) ---
    const handleRecordButtonPress = () => {
        if (recorderState.isRecording) {
            stopRecording();
            setRiveListenState(false);
        } else {
            startRecording();
            setRiveListenState(true);
        }
    };

    // --- 播放控制 (重播) ---
    const replayAudio = (uri: string | undefined) => {
        if (!uri) return;
        setPlaybackQueue(prev => [...prev, uri]);
    }

    const lastMessage = messages[messages.length - 1];
    const secondLastMessage = messages[messages.length - 2];

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
                                onPress={() => replayAudio(secondLastMessage?.uri)}
                                disabled={!secondLastMessage?.uri || isUploading}
                                style={[styles.smallButton, (!secondLastMessage?.uri || isUploading) && styles.disabledButton]}
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
                                onPress={() => replayAudio(lastMessage?.uri)}
                                disabled={!secondLastMessage?.uri || isUploading}
                                style={[styles.smallButton, (!secondLastMessage?.uri || isUploading) && styles.disabledButton]}
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
        marginTop: 100,
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
        zIndex: 10000
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