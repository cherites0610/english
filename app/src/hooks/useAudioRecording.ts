import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';

// 定義 Hook 回傳的狀態物件的型別
interface RecorderState {
    url: string | null;
    isRecording: boolean;
    // 你未來可以擴充，例如加入錄音的 metering data
}

// Hook 的回傳值型別
interface AudioRecordingHook {
    recorderState: RecorderState;
    startRecording: () => Promise<void>;
    stopRecording: () => Promise<void>;
}

export const useAudioRecording = (): AudioRecordingHook => {
    // 儲存錄音物件的 state
    const [recording, setRecording] = useState<Audio.Recording | undefined>();
    // 統一管理錄音相關的狀態
    const [recorderState, setRecorderState] = useState<RecorderState>({
        url: null,
        isRecording: false,
    });

    // 確保元件卸載時，如果還在錄音，會停止並卸載錄音物件，防止記憶體洩漏
    useEffect(() => {
        return () => {
            if (recording) {
                recording.stopAndUnloadAsync();
            }
        };
    }, [recording]);


    async function startRecording() {
        try {
            // 步驟 1: 請求麥克風權限
            console.log('Requesting permissions..');
            const permission = await Audio.requestPermissionsAsync();
            if (permission.status !== 'granted') {
                alert('無法錄音，因為未授予麥克風權限！');
                return;
            }
            console.log('Permissions granted.');

            // 步驟 2: 設定音訊模式，這對 iOS 很重要
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true, // 讓錄音和播放在靜音模式下也能運作
            });

            // 步驟 3: 開始錄音
            console.log('Starting recording..');
            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            setRecording(recording);
            setRecorderState({ ...recorderState, isRecording: true, url: null });
            console.log('Recording started');

        } catch (err) {
            console.error('Failed to start recording', err);
        }
    }

    async function stopRecording() {
        if (!recording) {
            return;
        }

        console.log('Stopping recording..');
        setRecording(undefined); // 清除錄音物件

        // 步驟 4: 停止並卸載錄音
        await recording.stopAndUnloadAsync();

        // 重新設定音訊模式，允許播放
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
        });

        // 步驟 5: 取得錄音檔案的 URI
        const uri = recording.getURI();
        console.log('Recording stopped and stored at', uri);

        // 更新狀態，將 isRecording 設為 false，並提供錄音檔案的 url
        setRecorderState({ ...recorderState, isRecording: false, url: uri });
    }

    return { recorderState, startRecording, stopRecording };
};