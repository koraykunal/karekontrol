import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import { Canvas, Image, Rect, Circle, Line, Path, Skia, useImage } from '@shopify/react-native-skia';
import type { Shape, Point, ShapeType, AnnotationColor, StrokeWidth } from '@/src/api/types/media.types';

interface SkiaAnnotationCanvasProps {
  backgroundUri: string;
  shapes: Shape[];
  currentShape: Shape | null;
  selectedTool: ShapeType;
  selectedColor: AnnotationColor;
  selectedStrokeWidth: StrokeWidth;
  isDrawing: boolean;
  onShapeStart: (point: Point) => void;
  onShapeUpdate: (point: Point) => void;
  onShapeEnd: () => void;
  canvasRef?: React.RefObject<any>;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function SkiaAnnotationCanvas({
  backgroundUri,
  shapes,
  currentShape,
  selectedTool,
  selectedColor,
  selectedStrokeWidth,
  isDrawing,
  onShapeStart,
  onShapeUpdate,
  onShapeEnd,
  canvasRef,
}: SkiaAnnotationCanvasProps) {
  const image = useImage(backgroundUri);

  const renderShape = useCallback((shape: Shape) => {
    const { type, points, color, strokeWidth } = shape;

    if (points.length === 0) return null;

    switch (type) {
      case 'rectangle': {
        if (points.length < 2) return null;
        const [start, end] = points;
        const x = Math.min(start.x, end.x);
        const y = Math.min(start.y, end.y);
        const width = Math.abs(end.x - start.x);
        const height = Math.abs(end.y - start.y);
        return (
          <Rect
            key={shape.id}
            x={x}
            y={y}
            width={width}
            height={height}
            color={color}
            style="stroke"
            strokeWidth={strokeWidth}
          />
        );
      }

      case 'circle': {
        if (points.length < 2) return null;
        const [start, end] = points;
        const centerX = start.x;
        const centerY = start.y;
        const radius = Math.sqrt(
          Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
        );
        return (
          <Circle
            key={shape.id}
            cx={centerX}
            cy={centerY}
            r={radius}
            color={color}
            style="stroke"
            strokeWidth={strokeWidth}
          />
        );
      }

      case 'line': {
        if (points.length < 2) return null;
        const [start, end] = points;
        return (
          <Line
            key={shape.id}
            p1={{ x: start.x, y: start.y }}
            p2={{ x: end.x, y: end.y }}
            color={color}
            strokeWidth={strokeWidth}
          />
        );
      }

      case 'arrow': {
        if (points.length < 2) return null;
        const [start, end] = points;
        const path = Skia.Path.Make();

        path.moveTo(start.x, start.y);
        path.lineTo(end.x, end.y);

        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const arrowLength = 20;
        const arrowAngle = Math.PI / 6;

        const arrow1X = end.x - arrowLength * Math.cos(angle - arrowAngle);
        const arrow1Y = end.y - arrowLength * Math.sin(angle - arrowAngle);
        const arrow2X = end.x - arrowLength * Math.cos(angle + arrowAngle);
        const arrow2Y = end.y - arrowLength * Math.sin(angle + arrowAngle);

        path.moveTo(end.x, end.y);
        path.lineTo(arrow1X, arrow1Y);
        path.moveTo(end.x, end.y);
        path.lineTo(arrow2X, arrow2Y);

        return (
          <Path
            key={shape.id}
            path={path}
            color={color}
            style="stroke"
            strokeWidth={strokeWidth}
            strokeCap="round"
            strokeJoin="round"
          />
        );
      }

      default:
        return null;
    }
  }, []);

  const imageRect = useMemo(() => {
    if (!image) return null;

    const imageWidth = image.width();
    const imageHeight = image.height();
    const imageAspect = imageWidth / imageHeight;
    const screenAspect = SCREEN_WIDTH / SCREEN_HEIGHT;

    let displayWidth = SCREEN_WIDTH;
    let displayHeight = SCREEN_HEIGHT;

    if (imageAspect > screenAspect) {
      displayHeight = SCREEN_WIDTH / imageAspect;
    } else {
      displayWidth = SCREEN_HEIGHT * imageAspect;
    }

    const x = (SCREEN_WIDTH - displayWidth) / 2;
    const y = (SCREEN_HEIGHT - displayHeight) / 2;

    return { x, y, width: displayWidth, height: displayHeight };
  }, [image]);

  return (
    <View style={styles.wrapper}>
      <Canvas
        style={styles.canvas}
        ref={canvasRef}
      >
        {image && imageRect && (
          <Image
            image={image}
            x={imageRect.x}
            y={imageRect.y}
            width={imageRect.width}
            height={imageRect.height}
            fit="contain"
          />
        )}

        {shapes.map(renderShape)}

        {currentShape && renderShape(currentShape)}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#000',
  },
  canvas: {
    flex: 1,
  },
});
