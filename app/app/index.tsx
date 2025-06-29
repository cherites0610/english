import Rive, { Fit, RiveRef } from 'rive-react-native';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRef, useState } from 'react';

// ====================================================================
// Demo 01: 您原本的可互動開關按鈕
// 我們將它封裝成一個獨立的元件
// ====================================================================
function SwitchButtonDemo() {
  const [isToggled, setIsToggled] = useState(false);
  const riveRef = useRef<RiveRef>(null);

  const handlePress = () => {
    riveRef.current?.setInputState('ButtonState', 'isOn', !isToggled);
    setIsToggled(!isToggled);
  };

  return (
    <View style={styles.demoContent}>
      <Text style={styles.demoTitle}>Demo 01: 可互動開關</Text>
      <TouchableOpacity onPress={handlePress} style={styles.riveContainer}>
        <Rive
          ref={riveRef}
          url="https://english-rive.s3.ap-northeast-1.amazonaws.com/switchbtn.riv"
          stateMachineName="ButtonState"
          autoplay={true}
          fit={Fit.Contain}
          style={{ flex: 1 }}
        />
      </TouchableOpacity>

      <TouchableOpacity onPress={handlePress}>
        <Text>
          切換開關
        </Text>
      </TouchableOpacity>

      <Text style={styles.statusText}>
        目前狀態: {isToggled ? 'ON' : 'OFF'}
      </Text>
    </View>
  );
}

// ====================================================================
// Demo 02: 一個新的、播放不同動畫的簡單 Rive 元件
// ====================================================================
function LoopingAnimationDemo() {
  return (
    <View style={styles.demoContent}>
      <Text style={styles.demoTitle}>Demo 02: 循環播放動畫</Text>
      <View style={styles.riveContainer}>
        <Rive
          url="https://public.rive.app/community/runtime-files/2195-4346-avatar-pack-use-case.riv"
          artboardName="Avatar 1"
          stateMachineName="avatar"
          style={{ flex: 1 }}
        />
      </View>
      <Text style={styles.statusText}>
        這是一個簡單的循環動畫。
      </Text>
    </View>
  );
}


// ====================================================================
// 主畫面 App 元件，負責管理和切換 Demo
// ====================================================================
export default function App() {
  // 1. 建立一個 state 來記住目前要顯示哪個 demo
  // 'demo01' 或 'demo02'
  const [activeDemo, setActiveDemo] = useState('demo01');

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.mainTitle}>Rive 動畫切換範例</Text>

      {/* 2. 建立兩個按鈕，用來改變 state */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, activeDemo === 'demo01' && styles.activeButton]}
          onPress={() => setActiveDemo('demo01')}>
          <Text style={styles.buttonText}>Demo 01</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, activeDemo === 'demo02' && styles.activeButton]}
          onPress={() => setActiveDemo('demo02')}>
          <Text style={styles.buttonText}>Demo 02</Text>
        </TouchableOpacity>
      </View>

      {/* 3. 條件渲染：根據 state 的值，決定要顯示哪個 Demo 元件 */}
      <View style={styles.demoContainer}>
        {activeDemo === 'demo01' && <SwitchButtonDemo />}
        {activeDemo === 'demo02' && <LoopingAnimationDemo />}
      </View>

    </SafeAreaView>
  );
}


// ====================================================================
// 樣式表 (Styles)
// ====================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    paddingTop: 40,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    padding: 4,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  activeButton: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  demoContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoContent: {
    alignItems: 'center',
  },
  demoTitle: {
    fontSize: 18,
    marginBottom: 15,
    fontWeight: '500',
  },
  riveContainer: {
    width: 300,
    height: 300,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
  },
  statusText: {
    marginTop: 15,
    color: '#666',
    fontSize: 14,
  }
});