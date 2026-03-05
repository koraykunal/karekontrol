import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import type { StepLog } from '@/src/api/types/procedure.types';
import type { CompletionStatus, IssueSeverity } from '../types';

interface UseStepCompletionProps {
    step: StepLog;
    procedureLogId: number;
    onStepCompleted: (stepId: number, data: any) => Promise<void>;
}

export function useStepCompletion({ step, procedureLogId, onStepCompleted }: UseStepCompletionProps) {
    const [isPending, setIsPending] = useState(false);

    const handleCompleteStep = useCallback(async (
        selectedStatus: CompletionStatus,
        capturedPhotos: string[],
        photoUrl: string | null,
        noteText: string,
        isValid: boolean,
        errorMessage: string | null,
        setIsExpanded: (v: boolean) => void,
        setCapturedPhotos: (urls: string[]) => void,
        severity?: IssueSeverity
    ) => {
        if (!isValid) {
            if (errorMessage) {
                Alert.alert('Eksik Bilgi', errorMessage);
            }
            return;
        }

        try {
            setIsPending(true);

            const allPhotos = [...capturedPhotos];
            if (photoUrl && !allPhotos.includes(photoUrl)) {
                allPhotos.push(photoUrl);
            }

            await onStepCompleted(step.id, {
                completion_status: selectedStatus,
                notes: noteText || undefined,
                photo_urls: allPhotos.length > 0 ? allPhotos : undefined,
                severity: selectedStatus === 'non_compliant' ? severity : undefined,
            });

            // Collapse on success
            setIsExpanded(false);
        } catch (error: any) {
            const msg = error?.response?.data?.detail || error?.message || 'İşlem kaydedilemedi.';
            Alert.alert('Hata', msg);
        } finally {
            setIsPending(false);
        }
    }, [step.id, onStepCompleted]);

    return { handleCompleteStep, isPending };
}
