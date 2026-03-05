export type MediaType = 'photo' | 'video';

export type CaptureMode = 'select' | 'camera' | 'preview';

export interface CapturedMedia {
    uri: string;
    type: MediaType;
    duration?: number;
    width?: number;
    height?: number;
}

export interface MediaCaptureModalProps {
    visible: boolean;
    onClose: () => void;
    onCapture: (media: CapturedMedia) => void;
}

export interface CameraScreenProps {
    onCapture: (media: CapturedMedia) => void;
    onCancel: () => void;
}

export interface PreviewScreenProps {
    media: CapturedMedia;
    onConfirm: () => void;
    onRetake: () => void;
    onCancel: () => void;
}

export type ShapeType = 'rectangle' | 'circle' | 'arrow' | 'line';

export type AnnotationColor = '#FF3B30' | '#007AFF' | '#34C759' | '#FFCC00' | '#FFFFFF';

export type StrokeWidth = 2 | 4 | 6;

export interface Point {
  x: number;
  y: number;
}

export interface Shape {
  id: string;
  type: ShapeType;
  points: Point[];
  color: AnnotationColor;
  strokeWidth: StrokeWidth;
}

export interface AnnotationState {
  shapes: Shape[];
  selectedTool: ShapeType;
  selectedColor: AnnotationColor;
  selectedStrokeWidth: StrokeWidth;
  isDrawing: boolean;
  currentShape: Shape | null;
}

export const DEFAULT_COLORS: AnnotationColor[] = [
  '#FF3B30',
  '#007AFF',
  '#34C759',
  '#FFCC00',
  '#FFFFFF',
];

export const DEFAULT_STROKE_WIDTHS: StrokeWidth[] = [2, 4, 6];

export const STROKE_WIDTH_LABELS = {
  2: 'İnce',
  4: 'Orta',
  6: 'Kalın',
};
