import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { CameraView as ExpoCameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import type { MediaCaptureModalProps, CapturedMedia } from '@/src/api/types/media.types';

interface CameraViewProps {
  onCapture: (media: CapturedMedia) => void;
  onCancel: () => void;
}

export function CameraView({ onCapture, onCancel }: CameraViewProps) {
  const [facing, setFacing] = useState<CameraType>('back');
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<ExpoCameraView>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    setIsCameraReady(false);
  }, [mediaType]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  if (!permission) {
    return <View style={styles.container}><Text>Loading...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color="#8E8E93" />
        <Text style={styles.permissionTitle}>Kamera İzni Gerekli</Text>
        <Text style={styles.permissionMessage}>
          {mediaType === 'photo' ? 'Fotoğraf çekmek' : 'Video kaydetmek'} için kamera iznine ihtiyaç var.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>İzin Ver</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>İptal</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const handleTakePicture = async () => {
    if (!cameraRef.current || !isCameraReady) {
      Alert.alert('Bekleyin', 'Kamera henüz hazır değil');
      return;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      if (photo) {
        const media: CapturedMedia = {
          uri: photo.uri,
          type: 'photo',
          width: photo.width,
          height: photo.height,
        };
        onCapture(media);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Hata', 'Fotoğraf çekilirken bir hata oluştu');
    }
  };

  const handleStartRecording = async () => {
    if (!cameraRef.current || isRecording) {
      return;
    }

    if (!isCameraReady) {
      Alert.alert('Bekleyin', 'Kamera henüz hazır değil. Lütfen birkaç saniye bekleyin.');
      return;
    }

    try {
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 9) {
            handleStopRecording();
            return 10;
          }
          return prev + 1;
        });
      }, 1000);

      await new Promise(resolve => setTimeout(resolve, 300));

      const video = await cameraRef.current.recordAsync({
        maxDuration: 10,
      });

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (video) {
        const media: CapturedMedia = {
          uri: video.uri,
          type: 'video',
          duration: recordingTime,
        };
        onCapture(media);
      }
    } catch (error: any) {
      console.error('Error recording video:', error);
      Alert.alert('Hata', `Video kaydedilirken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`);
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleStopRecording = () => {
    if (!cameraRef.current || !isRecording) return;

    cameraRef.current.stopRecording();
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleCapturePress = () => {
    if (mediaType === 'photo') {
      handleTakePicture();
    } else {
      if (isRecording) {
        handleStopRecording();
      } else {
        handleStartRecording();
      }
    }
  };

  return (
    <View style={styles.container}>
      <ExpoCameraView
        key={`${mediaType}-${facing}`}
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        mode={mediaType === 'video' ? 'video' : 'picture'}
        onCameraReady={() => setIsCameraReady(true)}
      >
        <View style={styles.overlay}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={onCancel} style={styles.topButton}>
              <Ionicons name="close" size={32} color="#FFF" />
            </TouchableOpacity>

            {mediaType === 'video' && isRecording && (
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingTime}>{recordingTime}s / 10s</Text>
              </View>
            )}

            <View style={styles.topRightButtons}>
              <TouchableOpacity
                onPress={() => {
                  setMediaType(prev => prev === 'photo' ? 'video' : 'photo');
                }}
                style={[
                  styles.topButton,
                  !isCameraReady && { opacity: 0.5 }
                ]}
                disabled={isRecording || !isCameraReady}
              >
                <Ionicons
                  name={mediaType === 'photo' ? 'videocam' : 'camera'}
                  size={28}
                  color="#FFF"
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={toggleCameraFacing}
                style={[
                  styles.topButton,
                  !isCameraReady && { opacity: 0.5 }
                ]}
                disabled={!isCameraReady}
              >
                <Ionicons name="camera-reverse" size={32} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bottomBar}>
            <View style={styles.captureButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.captureButton,
                  isRecording && styles.captureButtonRecording,
                  !isCameraReady && { opacity: 0.5 }
                ]}
                onPress={handleCapturePress}
                disabled={(isRecording && recordingTime >= 10) || !isCameraReady}
              >
                {mediaType === 'photo' ? (
                  <View style={styles.captureButtonInner} />
                ) : (
                  <View style={[
                    styles.videoButtonInner,
                    isRecording && styles.videoButtonInnerRecording,
                  ]} />
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.modeText}>
              {!isCameraReady ? 'HAZIRLANIYOR...' :
                mediaType === 'photo' ? 'FOTOĞRAF' :
                  isRecording ? 'KAYIT EDILIYOR' : 'VIDEO'}
            </Text>
          </View>
        </View>
      </ExpoCameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  permissionMessage: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
    marginTop: 16,
  },
  permissionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 16,
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  topButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 22,
  },
  topRightButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,59,48,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
  },
  recordingTime: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomBar: {
    paddingBottom: 40,
    alignItems: 'center',
    gap: 16,
  },
  captureButtonContainer: {
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 4,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonRecording: {
    borderColor: '#FF3B30',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF',
  },
  videoButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF3B30',
  },
  videoButtonInnerRecording: {
    width: 32,
    height: 32,
    borderRadius: 4,
  },
  modeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
