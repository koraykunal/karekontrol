import { StepLog } from '@/src/api/types/procedure.types';

export type CompletionStatus = 'compliant' | 'non_compliant' | 'not_applicable' | null;
export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface StepCardProps {
    step: StepLog;
    stepNumber: number;
    isActive: boolean;
    procedureLogId: number;
    onStepCompleted: (stepId: number, data: StepCompletionData) => Promise<void>;
}

export interface StepCompletionData {
    completion_status: CompletionStatus;
    notes?: string;
    photo_urls?: string[];
    severity?: IssueSeverity;
}

export interface StepState {
    isExpanded: boolean;
    setIsExpanded: (val: boolean) => void;
    selectedStatus: CompletionStatus;
    setSelectedStatus: (s: CompletionStatus) => void;
    capturedPhotos: string[];
    setCapturedPhotos: (urls: string[]) => void;
    noteText: string;
    setNoteText: (t: string) => void;
    photoUrl: string | null;
    notesModalVisible: boolean;
    setNotesModalVisible: (v: boolean) => void;
    reminderModalVisible: boolean;
    setReminderModalVisible: (v: boolean) => void;
    notesSaved: boolean;
    setNotesSaved: (v: boolean) => void;
    reminderSaved: boolean;
    setReminderSaved: (v: boolean) => void;
    severity: IssueSeverity;
    setSeverity: (s: IssueSeverity) => void;
    heightAnim: any;
    handleToggleExpand: () => void;
    isEditing: boolean;
    setIsEditing: (v: boolean) => void;
    isUploading: boolean;
    setIsUploading: (v: boolean) => void;
}

export interface RequiredFields {
    photo: boolean;
    notes: boolean;
}

export interface ValidationResult {
    isValid: boolean;
    errorMessage: string | null;
}
