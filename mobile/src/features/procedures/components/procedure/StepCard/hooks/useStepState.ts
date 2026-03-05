import { useState, useRef, useCallback } from 'react';
import { Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import type { StepLog } from '@/src/api/types/procedure.types';
import type { CompletionStatus, IssueSeverity, StepState } from '../types';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function useStepState(step: StepLog, isActive: boolean): StepState {
    const [isExpanded, setIsExpanded] = useState(isActive && !step.is_completed);
    const [selectedStatus, setSelectedStatus] = useState<CompletionStatus>(
        step.is_completed && step.completion_status
            ? (step.completion_status.toLowerCase() as CompletionStatus)
            : null
    );
    const [capturedPhotos, setCapturedPhotos] = useState<string[]>(step.photo_urls || []);
    const [noteText, setNoteText] = useState(step.notes || '');
    const [notesModalVisible, setNotesModalVisible] = useState(false);
    const [reminderModalVisible, setReminderModalVisible] = useState(false);
    const [notesSaved, setNotesSaved] = useState(!!step.notes);
    const [reminderSaved, setReminderSaved] = useState(false);
    const [severity, setSeverity] = useState<IssueSeverity>('medium');
    const [isEditing, setIsEditing] = useState(false);

    const heightAnim = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

    const handleToggleExpand = useCallback(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        const newValue = !isExpanded;
        setIsExpanded(newValue);

        Animated.timing(heightAnim, {
            toValue: newValue ? 1 : 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [isExpanded, heightAnim]);

    const [isUploading, setIsUploading] = useState(false);

    return {
        isExpanded,
        setIsExpanded,
        selectedStatus,
        setSelectedStatus,
        capturedPhotos,
        setCapturedPhotos,
        noteText,
        setNoteText,
        photoUrl: step.photo_urls?.[0] || null,
        notesModalVisible,
        setNotesModalVisible,
        reminderModalVisible,
        setReminderModalVisible,
        notesSaved,
        setNotesSaved,
        reminderSaved,
        setReminderSaved,
        severity,
        setSeverity,
        heightAnim,
        handleToggleExpand,
        isEditing,
        setIsEditing,
        isUploading,
        setIsUploading,
    };
}
