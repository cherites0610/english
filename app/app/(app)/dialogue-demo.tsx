import React, { useState, useRef } from 'react';
import { View, StyleSheet, Button } from 'react-native';
// RiveContainer is the default export, we can name it Rive
// RiveRef is the type for the ref object
import Rive, { RiveRef } from 'rive-react-native';

export default function DialogueScreen() {
    // 1. Create a ref to hold the Rive component instance
    const riveRef = useRef<RiveRef>(null);

    // Use React state to track the desired Rive input states
    const [isListening, setIsListening] = useState(false);
    const [isTalking, setIsTalking] = useState(false);

    // Function to toggle the "listen" state
    const toggleListen = () => {
        const nextValue = !isListening;
        setIsListening(nextValue);
        // 2. Call the setInputState method on the current ref value
        riveRef.current?.setInputState("State Machine 1", "listening", nextValue);
    };

    // Function to toggle the "talk" state
    const toggleTalk = () => {
        const nextValue = !isTalking;
        setIsTalking(nextValue);
        // Call the setInputState method for the 'talk' input
        riveRef.current?.setInputState("State Machine 1", "talk", nextValue);
    };

    return (
        <View style={styles.container}>
            <Rive
                // 3. Pass the ref to the Rive component
                ref={riveRef}
                url="https://mou-english.s3.ap-northeast-1.amazonaws.com/Anna.riv"
                artboardName="iPhone 16 - 1"
                stateMachineName="State Machine 1"
                autoplay={true}
                style={styles.rive}
            />

            <View style={styles.controls}>
                <Button
                    title={`Toggle Listen (Currently: ${isListening ? 'On' : 'Off'})`}
                    onPress={toggleListen}
                />
                <View style={{ height: 10 }} />
                <Button
                    title={`Toggle Talk (Currently: ${isTalking ? 'On' : 'Off'})`}
                    onPress={toggleTalk}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
    },
    rive: {
        width: 400,
        height: 400,
    },
    controls: {
        marginTop: 20,
        width: '80%',
    },
});
