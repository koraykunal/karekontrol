import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Image, StatusBar } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/constants/theme';

interface MediaViewerModalProps {
    visible: boolean;
    onClose: () => void;
    uri: string | null;
    type: 'photo' | 'video';
}

import { useEvent } from 'expo';

function VideoPlayer({ uri }: { uri: string }) {
    const player = useVideoPlayer(uri, player => {
        console.log('Initializing video player with URI:', uri);
        player.loop = true;
        player.play();
    });

    // useEvent result can be null, and we only need the player anyway
    useEvent(player, 'statusChange', { status: player.status });
    return (
        <View style={styles.videoContainer}>
            <VideoView
                player={player}
                style={styles.video}
                allowsFullscreen
                allowsPictureInPicture
                nativeControls
                contentFit="contain"
            />
        </View>
    );
}

export function MediaViewerModal({ visible, onClose, uri, type }: MediaViewerModalProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    if (!uri) return null;

    return (
        <Modal
            visible={visible}
            transparent={false}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <StatusBar hidden />

                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <Ionicons name="close" size={30} color="#FFF" />
                </TouchableOpacity>

                <View style={styles.content}>
                    {type === 'photo' ? (
                        <Image
                            source={{ uri }}
                            style={styles.image}
                            resizeMode="contain"
                        />
                    ) : (
                        <VideoPlayer uri={uri} />
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    videoContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    video: {
        width: '100%',
        height: '100%',
    },
});
