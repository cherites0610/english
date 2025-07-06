import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';

type MainHeaderProps = {
    variant: 'main';
    avatarUrl: string;
    name: string;
    userLevel: number;
    money: number;
    onAvatarPress?: () => void; // ✨ 新增 prop
};

type GameHeaderProps = {
    variant: 'game';
    title: string;
    onBackPress: () => void;
};

type HeaderProps = MainHeaderProps | GameHeaderProps;

const Header: React.FC<HeaderProps> = (props) => {
    const renderMainHeader = (p: MainHeaderProps) => (
        <View style={styles.container}>
            <View style={styles.leftContainer}>
                <TouchableOpacity onPress={p.onAvatarPress} activeOpacity={0.8}>
                    <Image source={{ uri: p.avatarUrl }} style={styles.avatar} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.nameText}>{p.name}</Text>
                    <Text style={styles.userLevelText}>Lv. {p.userLevel}</Text>
                </View>
            </View>
            <View style={styles.rightContainer}>
                <Text style={styles.moneyText}>💰 {p.money.toLocaleString()}</Text>
            </View>
        </View>
    );

    const renderGameHeader = (p: GameHeaderProps) => (
        <View style={styles.container}>
            <TouchableOpacity onPress={p.onBackPress} style={styles.backButton}>
                <Text style={styles.backButtonText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.titleText}>{p.title}</Text>
            <View style={styles.backButton} />
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            {props.variant === 'main' ? renderMainHeader(props) : renderGameHeader(props)}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        backgroundColor: '#fff',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 60,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    leftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rightContainer: {},
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    nameText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    userLevelText: {
        fontSize: 14,
        color: '#666',
    },
    moneyText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#E6A23C',
    },
    backButton: {
        width: 40,
        justifyContent: 'center',
    },
    backButtonText: {
        fontSize: 30,
        color: '#333',
    },
    titleText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default Header;