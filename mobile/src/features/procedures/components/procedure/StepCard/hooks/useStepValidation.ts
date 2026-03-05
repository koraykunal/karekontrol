import { useCallback } from 'react';
import type { StepLog } from '@/src/api/types/procedure.types';
import type { CompletionStatus, RequiredFields, ValidationResult } from '../types';

export function useStepValidation() {
    const getRequiredFields = useCallback((status: CompletionStatus, step: StepLog): RequiredFields => {
        // Non-compliant: Validation handles "OR" logic, so we don't mark individual fields as strictly required in UI
        if (status === 'non_compliant') {
            return { photo: false, notes: false };
        }

        // User Request: Photo and notes should ONLY be mandatory if non-compliant.
        // This overrides the step definition setting for 'requires_photo'.
        return {
            photo: false,
            notes: false,
        };
    }, []);

    const validateCompletion = useCallback((
        status: CompletionStatus,
        capturedPhotos: string[],
        photoUrl: string | null,
        noteText: string,
        requiredFields: RequiredFields
    ): ValidationResult => {
        if (!status) {
            return { isValid: false, errorMessage: 'Lütfen bir durum seçiniz.' };
        }

        // Special case for non-compliant: Require EITHER photo OR notes
        if (status === 'non_compliant') {
            const hasPhoto = (capturedPhotos.length > 0 || !!photoUrl);
            const hasNote = (noteText && noteText.trim().length > 0);

            if (!hasPhoto && !hasNote) {
                return { isValid: false, errorMessage: 'Uygunsuzluk durumunda en az bir fotoğraf veya not eklemelisiniz.' };
            }
            return { isValid: true, errorMessage: null };
        }

        if (requiredFields.photo && capturedPhotos.length === 0 && !photoUrl) {
            return { isValid: false, errorMessage: 'Bu adım için fotoğraf zorunludur.' };
        }

        if (requiredFields.notes && !noteText.trim()) {
            return { isValid: false, errorMessage: 'Bu adım için not zorunludur.' };
        }

        return { isValid: true, errorMessage: null };
    }, []);

    return { getRequiredFields, validateCompletion };
}
