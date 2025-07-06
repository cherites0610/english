import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import CustomModal from './CustomModal';
import MailListItem from './MailListItem';
import { initialMails, Mail } from '../services/gameService';

type MailModalProps = {
    isVisible: boolean;
    onClose: () => void;
};

const MailModal: React.FC<MailModalProps> = ({ isVisible, onClose }) => {
    const [mails, setMails] = useState<Mail[]>(initialMails);

    const handleMailPress = (mailId: string) => {
        setMails(currentMails =>
            currentMails.map(mail =>
                mail.id === mailId ? { ...mail, isRead: true } : mail
            )
        );
        Alert.alert('郵件已讀', `郵件 ${mailId} 已被標示為已讀`);
    };

    return (
        <CustomModal
            isVisible={isVisible}
            onClose={onClose}
            title="收件匣"
            buttons={[{ text: '關閉', onPress: onClose, style: 'primary' }]}
        >
            <View style={styles.modalContent}>
                <FlatList
                    data={mails}
                    renderItem={({ item }) => (
                        <MailListItem mail={item} onPress={() => handleMailPress(item.id)} />
                    )}
                    keyExtractor={item => item.id}
                />
            </View>
        </CustomModal>
    );
};

const styles = StyleSheet.create({
    modalContent: {
        height: 400,
        width: '100%',
    },
});

export default MailModal;