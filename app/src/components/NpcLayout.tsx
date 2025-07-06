// 檔案路徑: components/NpcLayout.tsx

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import NpcItem from './NpcItem';
import { DisplayedNpc, NpcData } from '../services/gameService'; // 匯入類型

type NpcLayoutProps = {
    npcs: DisplayedNpc[];
    onNpcPress: (npc: NpcData) => void;
};


const NpcLayout: React.FC<NpcLayoutProps> = ({ npcs, onNpcPress }) => {
    return (
        <View style={styles.container}>
            {npcs.map((npc) => (
                <View key={npc.id} style={[styles.npcWrapper, npc.position]}>
                    <NpcItem
                        imageUrl={npc.imageUrl}
                        bubbleCount={npc.bubbleCount}
                        onAnimationEnd={() => onNpcPress(npc)}
                    />
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 5,
        pointerEvents: 'box-none',
    },
    npcWrapper: {
        position: 'absolute',
    },
});

export default NpcLayout;