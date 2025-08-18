import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import CustomModal from './CustomModal';
import MailListItem from './MailListItem';
import { Mail } from '../types/mail.type';
import { useMail } from '../hooks/useMail';

type MailModalProps = {
    isVisible: boolean;
    onClose: () => void;
};

const MailModal: React.FC<MailModalProps> = ({ isVisible, onClose }) => {
    const { mail, isLoading, error, readMail } = useMail();

    const handleMailPress = (mailId: string) => {
        // setMails(currentMails =>
        //     currentMails.map(mail =>
        //         mail.id === mailId ? { ...mail, isRead: true } : mail
        //     )
        // );
        readMail(mailId)
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
                    data={mail}
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