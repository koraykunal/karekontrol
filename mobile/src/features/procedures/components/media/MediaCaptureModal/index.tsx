import React, { useState, useMemo } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius } from '@/src/constants/theme';
import type { CapturedMedia, MediaCaptureModalProps } from '@/src/api/types/media.types';
import { CameraView } from './components/CameraView';
import { PreviewView } from './components/PreviewView';
import { AnnotationScreen } from './components/AnnotationScreen';

type CaptureMode = 'camera' | 'preview' | 'annotation';

export function MediaCaptureModal({ visible, onClose, onCapture }: MediaCaptureModalProps) {
  const [mode, setMode] = useState<CaptureMode>('camera');
  const [capturedMedia, setCapturedMedia] = useState<CapturedMedia | null>(null);

  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleClose = () => {
    setMode('camera');
    setCapturedMedia(null);
    onClose();
  };

  const handleMediaCapture = (media: CapturedMedia) => {
    setCapturedMedia(media);
    setMode('preview');
  };

  const handleConfirm = () => {
    if (capturedMedia) {
      onCapture(capturedMedia);
      handleClose();
    }
  };

  const handleRetake = () => {
    setCapturedMedia(null);
    setMode('camera');
  };

  const handleAnnotate = () => {
    setMode('annotation');
  };

  const handleAnnotationConfirm = (annotatedUri: string) => {
    if (capturedMedia) {
      onCapture({
        ...capturedMedia,
        uri: annotatedUri,
      });
      handleClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {mode === 'camera' && (
          <CameraView
            onCapture={handleMediaCapture}
            onCancel={handleClose}
          />
        )}

        {mode === 'preview' && capturedMedia && (
          <PreviewView
            media={capturedMedia}
            onConfirm={handleConfirm}
            onRetake={handleRetake}
            onAnnotate={handleAnnotate}
            onCancel={handleClose}
          />
        )}

        {mode === 'annotation' && capturedMedia && (
          <AnnotationScreen
            media={capturedMedia}
            onConfirm={handleAnnotationConfirm}
            onCancel={handleClose}
          />
        )}
      </View>
    </Modal>
  );
}

const createStyles = (theme: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  selectContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  headerSpacer: {
    width: 40,
  },
  selectContent: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  selectCard: {
    backgroundColor: theme.backgroundSecondary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 2,
    borderColor: theme.border,
  },
  selectCardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
  },
  selectCardSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  placeholder: {
    fontSize: 18,
    color: theme.textSecondary,
    textAlign: 'center',
    marginTop: 100,
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  previewActions: {
    flexDirection: 'row',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: theme.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFF', // Primary button text always white usually
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: theme.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

