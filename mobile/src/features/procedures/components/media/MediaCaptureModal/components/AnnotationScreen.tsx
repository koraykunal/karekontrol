import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, PanResponder, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import { SkiaAnnotationCanvas } from './SkiaAnnotationCanvas';
import type { CapturedMedia, Shape, Point, ShapeType, AnnotationColor, StrokeWidth } from '@/src/api/types/media.types';
import { DEFAULT_COLORS } from '@/src/api/types/media.types';

interface AnnotationScreenProps {
  media: CapturedMedia;
  onConfirm: (annotatedUri: string) => void;
  onCancel: () => void;
}

export function AnnotationScreen({ media, onConfirm, onCancel }: AnnotationScreenProps) {
  const canvasRef = useRef<any>(null);
  const viewRef = useRef<View>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [shapes, setShapes] = useState<Shape[]>([]);
  const [history, setHistory] = useState<Shape[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [selectedTool, setSelectedTool] = useState<ShapeType>('rectangle');
  const [selectedColor, setSelectedColor] = useState<AnnotationColor>('#FF3B30');
  const [selectedStrokeWidth, setSelectedStrokeWidth] = useState<StrokeWidth>(4);

  const addToHistory = useCallback((newShapes: Shape[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newShapes);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const handleShapeStart = useCallback((point: Point) => {
    const newShape: Shape = {
      id: Date.now().toString(),
      type: selectedTool,
      points: [point],
      color: selectedColor,
      strokeWidth: selectedStrokeWidth,
    };
    setCurrentShape(newShape);
    setIsDrawing(true);
  }, [selectedTool, selectedColor, selectedStrokeWidth]);

  const handleShapeUpdate = useCallback((point: Point) => {
    if (!currentShape) return;

    setCurrentShape({
      ...currentShape,
      points: [currentShape.points[0], point],
    });
  }, [currentShape]);

  const handleShapeEnd = useCallback(() => {
    if (!currentShape) return;

    if (currentShape.points.length >= 2) {
      const newShapes = [...shapes, currentShape];
      setShapes(newShapes);
      addToHistory(newShapes);
    }

    setCurrentShape(null);
    setIsDrawing(false);
  }, [currentShape, shapes, addToHistory]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setShapes(history[newIndex]);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setShapes(history[newIndex]);
    }
  }, [history, historyIndex]);

  const handleClear = useCallback(() => {
    Alert.alert(
      'Tüm Çizimleri Sil',
      'Tüm annotation\'lar silinecek. Emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            setShapes([]);
            addToHistory([]);
          },
        },
      ]
    );
  }, [addToHistory]);

  const handleConfirm = useCallback(async () => {
    try {
      if (shapes.length === 0) {
        onConfirm(media.uri);
        return;
      }

      setIsSaving(true);

      if (!viewRef.current) {
        throw new Error('Canvas ref not available');
      }

      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 0.9,
        result: 'tmpfile',
      });

      onConfirm(uri);
    } catch (error) {
      console.error('Error saving annotation:', error);
      Alert.alert('Hata', 'Annotation kaydedilemedi. Orijinal fotoğraf kullanılacak.');
      onConfirm(media.uri);
    } finally {
      setIsSaving(false);
    }
  }, [shapes, media.uri, onConfirm]);

  const shapeStartRef = useRef(handleShapeStart);
  const shapeUpdateRef = useRef(handleShapeUpdate);
  const shapeEndRef = useRef(handleShapeEnd);

  shapeStartRef.current = handleShapeStart;
  shapeUpdateRef.current = handleShapeUpdate;
  shapeEndRef.current = handleShapeEnd;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: (event) => {
        const { locationX, locationY } = event.nativeEvent;
        shapeStartRef.current({ x: locationX, y: locationY });
      },
      onPanResponderMove: (event) => {
        const { locationX, locationY } = event.nativeEvent;
        shapeUpdateRef.current({ x: locationX, y: locationY });
      },
      onPanResponderRelease: () => {
        shapeEndRef.current();
      },
      onPanResponderTerminate: () => {
        shapeEndRef.current();
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <View style={styles.canvasWrapper} ref={viewRef} collapsable={false}>
        <SkiaAnnotationCanvas
          backgroundUri={media.uri}
          shapes={shapes}
          currentShape={currentShape}
          selectedTool={selectedTool}
          selectedColor={selectedColor}
          selectedStrokeWidth={selectedStrokeWidth}
          isDrawing={isDrawing}
          onShapeStart={handleShapeStart}
          onShapeUpdate={handleShapeUpdate}
          onShapeEnd={handleShapeEnd}
          canvasRef={canvasRef}
        />
        <View
          style={styles.touchOverlay}
          {...panResponder.panHandlers}
        />
      </View>

      <View style={styles.topBar} pointerEvents="box-none">
        <TouchableOpacity onPress={onCancel} style={styles.topButton} disabled={isSaving}>
          <Ionicons name="close" size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.topActions}>
          <TouchableOpacity
            onPress={handleUndo}
            disabled={historyIndex === 0 || isSaving}
            style={[styles.topActionButton, historyIndex === 0 && styles.topActionButtonDisabled]}
          >
            <Ionicons name="arrow-undo" size={20} color={historyIndex > 0 ? '#FFF' : '#666'} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleRedo}
            disabled={historyIndex >= history.length - 1 || isSaving}
            style={[styles.topActionButton, historyIndex >= history.length - 1 && styles.topActionButtonDisabled]}
          >
            <Ionicons name="arrow-redo" size={20} color={historyIndex < history.length - 1 ? '#FFF' : '#666'} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleClear} disabled={isSaving} style={styles.topActionButton}>
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Ionicons name="checkmark" size={24} color="#FFF" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.bottomBar} pointerEvents={isSaving ? 'none' : 'box-none'}>
        <View style={styles.toolSection}>
          {(['rectangle', 'circle', 'arrow', 'line'] as const).map((tool) => (
            <TouchableOpacity
              key={tool}
              style={[styles.toolButton, selectedTool === tool && styles.toolButtonActive]}
              onPress={() => setSelectedTool(tool)}
            >
              {tool === 'rectangle' && <Ionicons name="square-outline" size={24} color={selectedTool === tool ? '#007AFF' : '#FFF'} />}
              {tool === 'circle' && <Ionicons name="ellipse-outline" size={24} color={selectedTool === tool ? '#007AFF' : '#FFF'} />}
              {tool === 'arrow' && <Ionicons name="arrow-forward" size={24} color={selectedTool === tool ? '#007AFF' : '#FFF'} />}
              {tool === 'line' && <Ionicons name="remove" size={24} color={selectedTool === tool ? '#007AFF' : '#FFF'} />}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.colorSection}>
          {DEFAULT_COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorButton,
                { backgroundColor: color },
                color === '#FFFFFF' && styles.colorButtonWhite,
                selectedColor === color && styles.colorButtonActive,
              ]}
              onPress={() => setSelectedColor(color)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  canvasWrapper: {
    flex: 1,
    position: 'relative',
  },
  touchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  topButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
  },
  topActions: {
    flexDirection: 'row',
    gap: 12,
  },
  topActionButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
  },
  topActionButtonDisabled: {
    opacity: 0.5,
  },
  confirmButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    borderRadius: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    gap: 16,
  },
  toolSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  toolButton: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  toolButtonActive: {
    backgroundColor: '#FFF',
    borderColor: '#007AFF',
  },
  colorSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  colorButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorButtonWhite: {
    borderColor: '#666',
  },
  colorButtonActive: {
    borderWidth: 3,
    borderColor: '#FFF',
    transform: [{ scale: 1.15 }],
  },
});
