import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';

export type ButtonConfig = {
    text: string;
    onPress: () => void;
    style?: 'primary' | 'secondary';
};

type CustomModalProps = {
    isVisible: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    buttons?: ButtonConfig[];
    closeOnBackdropPress?: boolean;
    showCloseButton?: boolean;
};

const CustomModal: React.FC<CustomModalProps> = ({
    isVisible,
    onClose,
    title,
    children,
    buttons,
    closeOnBackdropPress = true,
    showCloseButton = false,
}) => {

    const handleBackdropPress = () => {
        if (closeOnBackdropPress) {
            onClose();
        }
    };

    return (
        <Modal
            visible={isVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.backdrop}
                activeOpacity={1}
                onPress={handleBackdropPress}
            >
                <TouchableWithoutFeedback>
                    <View style={styles.modalContainer}>
                        {showCloseButton && (
                            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                                <Text style={styles.closeButtonText}>×</Text>
                            </TouchableOpacity>
                        )}

                        <Text style={styles.title}>{title}</Text>

                        <View style={styles.contentContainer}>
                            {children}
                        </View>

                        {buttons && buttons.length > 0 && (
                            <View style={styles.buttonRow}>
                                {buttons.map((button, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.buttonBase,
                                            button.style === 'primary' ? styles.primaryButton : styles.secondaryButton
                                        ]}
                                        onPress={button.onPress}
                                    >
                                        <Text
                                            style={[
                                                styles.buttonTextBase,
                                                button.style === 'primary' ? styles.primaryButtonText : styles.secondaryButtonText
                                            ]}
                                        >
                                            {button.text}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                </TouchableWithoutFeedback>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '85%',
        maxWidth: 400,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    closeButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#F2F2F7',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    closeButtonText: {
        fontSize: 20,
        color: '#8A8A8E',
        lineHeight: 22,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
    },
    contentContainer: {
        marginBottom: 24,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
    },
    buttonBase: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        minWidth: 80,
    },
    primaryButton: {
        backgroundColor: '#007AFF',
    },
    secondaryButton: {
        backgroundColor: '#E5E5EA',
    },
    buttonTextBase: {
        fontSize: 16,
        fontWeight: '600',
    },
    primaryButtonText: {
        color: 'white',
    },
    secondaryButtonText: {
        color: '#007AFF',
    },
});

export default CustomModal;