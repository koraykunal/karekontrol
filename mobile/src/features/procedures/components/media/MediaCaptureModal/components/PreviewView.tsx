import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import type { CapturedMedia } from '@/src/api/types/media.types';

interface PreviewViewProps {
  media: CapturedMedia;
  onConfirm: () => void;
  onRetake: () => void;
  onAnnotate: () => void;
  onCancel: () => void;
}

function VideoPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, player => {
    player.loop = true;
    player.play();
  });

  return (
    <VideoView
      player={player}
      style={styles.video}
      allowsFullscreen
      allowsPictureInPicture
    />
  );
}

export function PreviewView({ media, onConfirm, onRetake, onAnnotate, onCancel }: PreviewViewProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.headerButton}>
          <Ionicons name="close" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {media.type === 'photo' ? 'Fotoğraf Önizleme' : 'Video Önizleme'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.mediaContainer}>
        {media.type === 'photo' ? (
          <Image
            source={{ uri: media.uri }}
            style={styles.image}
            resizeMode="contain"
          />
        ) : (
          <VideoPreview uri={media.uri} />
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.secondaryButton} onPress={onRetake}>
          <Ionicons name="camera-outline" size={24} color="#000" />
          <Text style={styles.secondaryButtonText}>Tekrar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.annotateButton} onPress={onAnnotate}>
          <Ionicons name="brush-outline" size={24} color="#FFF" />
          <Text style={styles.annotateButtonText}>Çiz</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryButton} onPress={onConfirm}>
          <Ionicons name="checkmark" size={24} color="#FFF" />
          <Text style={styles.primaryButtonText}>Onayla</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerSpacer: {
    width: 40,
  },
  mediaContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  actions: {
    flexDirection: 'row',
    padding: 24,
    gap: 12,
    backgroundColor: '#FFF',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  annotateButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FF9500',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  annotateButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
