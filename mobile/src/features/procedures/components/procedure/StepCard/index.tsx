import React, { useEffect, useMemo } from 'react';
import { View, Animated, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { Card } from '@/src/components/common/Card';
import { Text } from '@/src/components/common/Text';
import { Colors } from '@/src/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { uploadService } from '@/src/api/services/upload.service';
import { MediaCaptureModal } from '@/src/features/procedures/components/media/MediaCaptureModal';
import type { CapturedMedia } from '@/src/api/types/media.types';

import { StepHeader, ActionButtons, CompletedSection, RequiredFieldsSection } from './components';
import { useStepState, useStepValidation, useStepCompletion } from './hooks';
import { createStyles } from './styles';
import type { StepCardProps } from './types';
import { ReminderModal } from '@/src/features/procedures/components/ReminderModal';
import { procedureEndpoints } from '@/src/api/endpoints/procedure.endpoints';

const StepCardInternal: React.FC<StepCardProps> = ({
    step,
    stepNumber,
    isActive,
    procedureLogId,
    onStepCompleted,
}) => {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const styles = createStyles(theme);

    const state = useStepState(step, isActive);
    const { getRequiredFields, validateCompletion } = useStepValidation();
    const { handleCompleteStep: completeStepHandler, isPending } = useStepCompletion({
        step,
        procedureLogId,
        onStepCompleted,
    });

    const [showNotes, setShowNotes] = React.useState(false);
    const [mediaModalVisible, setMediaModalVisible] = React.useState(false);
    const [reminderModalVisible, setReminderModalVisible] = React.useState(false);
    const [existingReminder, setExistingReminder] = React.useState<{ id: number; remind_at: string; message: string } | null>(null);
    const [reminderFetched, setReminderFetched] = React.useState(false);

    const fetchExistingReminder = React.useCallback(async () => {
        try {
            const response = await procedureEndpoints.getStepReminders(step.id);
            const data = response.data as any;
            const items = data?.data || data || [];
            if (Array.isArray(items) && items.length > 0) {
                const active = items.find((r: any) => !r.is_sent);
                setExistingReminder(active || null);
            } else {
                setExistingReminder(null);
            }
        } catch (error) {
            setExistingReminder(null);
        } finally {
            setReminderFetched(true);
        }
    }, [step.id]);

    useEffect(() => {
        if (state.isExpanded && !reminderFetched) {
            fetchExistingReminder();
        }
    }, [state.isExpanded, reminderFetched, fetchExistingReminder]);

    const handleSetReminder = async (remindAt: Date, message: string) => {
        try {
            if (existingReminder) {
                await procedureEndpoints.deleteStepReminder(existingReminder.id);
            }
            await procedureEndpoints.createStepReminder(
                step.id,
                remindAt.toISOString(),
                message
            );
            await fetchExistingReminder();
            Alert.alert('Başarılı', 'Hatırlatıcı kuruldu!');
        } catch (error) {
            Alert.alert('Hata', 'Hatırlatıcı kurulamadı.');
        }
    };

    const handleDeleteReminder = async () => {
        if (!existingReminder) return;
        try {
            await procedureEndpoints.deleteStepReminder(existingReminder.id);
            setExistingReminder(null);
            Alert.alert('Başarılı', 'Hatırlatıcı silindi.');
        } catch (error) {
            Alert.alert('Hata', 'Hatırlatıcı silinemedi.');
        }
    };

    const handleMediaCapture = async (media: CapturedMedia) => {
        try {
            state.setIsUploading(true);
            const response = await uploadService.uploadMedia(media.uri, media.type);

            if (response.success && response.url) {
                state.setCapturedPhotos([...state.capturedPhotos, response.url]);
            } else {
                throw new Error('Sunucu "başarısız" yanıtı döndü');
            }
        } catch (error: any) {
            const msg = error.response?.data?.message || error.message || 'Bağlantı hatası';
            Alert.alert('Yükleme Hatası', `Medya yüklenemedi:\n${msg}`);
        } finally {
            state.setIsUploading(false);
        }
    };

    const handleCameraPress = () => {
        setMediaModalVisible(true);
    };

    // Auto-expand when becomes active
    useEffect(() => {
        if (isActive && !state.isExpanded && !step.is_completed) {
            state.setIsExpanded(true);
            Animated.timing(state.heightAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: false,
            }).start();
        }
    }, [isActive]);

    // Auto-expand on non-compliant selection
    useEffect(() => {
        if (state.selectedStatus === 'non_compliant' && !state.isExpanded) {
            state.setIsExpanded(true);
            Animated.timing(state.heightAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: false,
            }).start();
        }
    }, [state.selectedStatus]);

    const requiredFields = useMemo(() => {
        return getRequiredFields(state.selectedStatus, step);
    }, [state.selectedStatus, step, getRequiredFields]);

    const validationResult = useMemo(() => {
        return validateCompletion(
            state.selectedStatus,
            state.capturedPhotos,
            state.photoUrl,
            state.noteText,
            requiredFields
        );
    }, [state.selectedStatus, state.capturedPhotos, state.photoUrl, state.noteText, requiredFields, validateCompletion]);

    const handleCompleteStep = async () => {
        await completeStepHandler(
            state.selectedStatus,
            state.capturedPhotos,
            state.photoUrl,
            state.noteText,
            validationResult.isValid,
            validationResult.errorMessage,
            state.setIsExpanded,
            state.setCapturedPhotos,
            state.severity
        );
        state.setIsEditing(false);
    };

    // Determine border color
    const status = step.completion_status?.toUpperCase();
    const statusColor = step.is_completed
        ? theme[status === 'COMPLIANT' ? 'success' : status === 'NON_COMPLIANT' ? 'error' : 'warning']
        : isActive ? theme.primary : theme.border;

    return (
        <Card style={{ ...styles.card, borderLeftColor: statusColor }} noPadding>
            <StepHeader
                step={step}
                stepNumber={stepNumber}
                isActive={isActive}
                isExpanded={state.isExpanded}
                selectedStatus={state.selectedStatus}
                theme={theme}
                onToggleExpand={state.handleToggleExpand}
                onEdit={step.is_completed && !state.isEditing ? () => {
                    state.setIsEditing(true);
                    if (!state.isExpanded) {
                        state.handleToggleExpand();
                    }
                } : undefined}
            />

            <Animated.View
                style={[
                    styles.content,
                    {
                        opacity: state.heightAnim,
                        display: state.isExpanded ? 'flex' : 'none',
                    },
                ]}
            >
                {state.isExpanded && (
                    <View>
                        {/* Description */}
                        {step.procedure_step?.description && (
                            <Text color={theme.textSecondary} style={styles.description}>
                                {step.procedure_step.description}
                            </Text>
                        )}

                        {/* Completed View */}
                        {step.is_completed && !state.isEditing && (
                            <CompletedSection
                                step={step}
                                theme={theme}
                            />
                        )}

                        {/* Active Step Actions (Show if active AND not completed, OR if editing) */}
                        {((isActive && !step.is_completed) || state.isEditing) && (
                            <>
                                <ActionButtons
                                    selectedStatus={state.selectedStatus}
                                    onStatusChange={state.setSelectedStatus}
                                    isPending={isPending}
                                    theme={theme}
                                />

                                <View style={styles.utilityRow}>
                                    <TouchableOpacity
                                        style={[
                                            styles.utilityButton,
                                            state.capturedPhotos.length > 0 && { borderColor: theme.primary, backgroundColor: theme.primaryLight }
                                        ]}
                                        onPress={handleCameraPress}
                                        disabled={state.isUploading}
                                        activeOpacity={0.7}
                                    >
                                        {state.isUploading ? (
                                            <ActivityIndicator size="small" color={theme.primary} />
                                        ) : (
                                            <MaterialIcons
                                                name="photo-camera"
                                                size={20}
                                                color={state.capturedPhotos.length > 0 ? theme.primary : theme.textSecondary}
                                            />
                                        )}
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.utilityButton,
                                            (showNotes || state.noteText.length > 0) && { borderColor: theme.primary, backgroundColor: theme.primaryLight }
                                        ]}
                                        onPress={() => setShowNotes(!showNotes)}
                                        activeOpacity={0.7}
                                    >
                                        <MaterialIcons
                                            name="short-text"
                                            size={22}
                                            color={(showNotes || state.noteText.length > 0) ? theme.primary : theme.textSecondary}
                                        />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.utilityButton,
                                            existingReminder && { borderColor: theme.primary, backgroundColor: theme.primaryLight }
                                        ]}
                                        onPress={() => setReminderModalVisible(true)}
                                        activeOpacity={0.7}
                                    >
                                        <MaterialIcons
                                            name="alarm"
                                            size={20}
                                            color={existingReminder ? theme.primary : theme.textSecondary}
                                        />
                                    </TouchableOpacity>
                                </View>

                                <RequiredFieldsSection
                                    requiredPhoto={requiredFields.photo}
                                    requiredNotes={requiredFields.notes || showNotes}
                                    capturedPhotos={state.capturedPhotos}
                                    setCapturedPhotos={state.setCapturedPhotos}
                                    noteText={state.noteText}
                                    setNoteText={state.setNoteText}
                                    theme={theme}
                                    isPending={isPending}
                                    severity={state.severity}
                                    setSeverity={state.setSeverity}
                                    showSeverity={state.selectedStatus === 'non_compliant'}
                                />

                                {/* Complete Button */}
                                <TouchableOpacity
                                    style={[
                                        styles.submitButton,
                                        isPending && { opacity: 0.7 },
                                        !validationResult.isValid && { backgroundColor: theme.textMuted } // Gray out if invalid
                                    ]}
                                    onPress={handleCompleteStep}
                                    disabled={isPending || !validationResult.isValid}
                                    activeOpacity={0.8}
                                >
                                    {isPending ? (
                                        <ActivityIndicator size="small" color="#FFF" />
                                    ) : (
                                        <MaterialIcons name="check" size={28} color="#FFF" />
                                    )}
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                )}
            </Animated.View>

            <MediaCaptureModal
                visible={mediaModalVisible}
                onClose={() => setMediaModalVisible(false)}
                onCapture={handleMediaCapture}
            />

            <ReminderModal
                visible={reminderModalVisible}
                onClose={() => setReminderModalVisible(false)}
                onSetReminder={handleSetReminder}
                onDeleteReminder={handleDeleteReminder}
                existingReminder={existingReminder}
                stepTitle={step.procedure_step?.title || step.step_title}
            />
        </Card>
    );
};

export const StepCard = React.memo(StepCardInternal);
