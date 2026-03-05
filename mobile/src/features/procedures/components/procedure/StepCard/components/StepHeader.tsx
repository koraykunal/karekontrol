import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Text } from '@/src/components/common/Text';
import { createStyles } from '../styles';
import type { StepLog } from '@/src/api/types/procedure.types';
import type { CompletionStatus } from '../types';

interface StepHeaderProps {
    step: StepLog;
    stepNumber: number;
    isActive: boolean;
    isExpanded: boolean;
    selectedStatus: CompletionStatus;
    theme: any;
    onToggleExpand: () => void;
    onEdit?: () => void;
}

export const StepHeader: React.FC<StepHeaderProps> = ({
    step,
    stepNumber,
    isActive,
    isExpanded,
    selectedStatus,
    theme,
    onToggleExpand,
    onEdit,
}) => {
    const styles = createStyles(theme);

    const getIcon = () => {
        if (step.is_completed) {
            const status = step.completion_status?.toUpperCase();

            if (status === 'NON_COMPLIANT') {
                return <MaterialIcons name="cancel" size={28} color={theme.error} />;
            }
            if (status === 'NOT_APPLICABLE') {
                return <MaterialIcons name="remove-circle" size={28} color={theme.warning} />;
            }
            // Default to compliant/success
            return <MaterialIcons name="check-circle" size={28} color={theme.success} />;
        }
        if (isActive) {
            return <MaterialIcons name="play-circle-filled" size={32} color={theme.primary} />;
        }
        return <MaterialIcons name="radio-button-unchecked" size={28} color={theme.textMuted} />;
    };

    const hasResolvedIssue = step.issues?.some(i => i.status === 'RESOLVED');

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={onToggleExpand}
            style={[
                styles.header,
                { borderBottomColor: theme.border, borderBottomWidth: isExpanded ? 1 : 0 }
            ]}
        >
            <View style={styles.headerLeft}>
                <View style={styles.iconContainer}>
                    {getIcon()}
                </View>

                <View style={styles.headerContent}>
                    <Text style={styles.metaText} color={theme.textSecondary}>
                        Adım {stepNumber}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        <Text weight="bold" color={theme.text} style={styles.title} numberOfLines={2}>
                            {step.procedure_step?.title || step.step_title || `Adım ${stepNumber}`}
                        </Text>

                        {/* Resolved Indicator */}
                        {hasResolvedIssue && (
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: theme.successLight + '30',
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 4,
                                gap: 2
                            }}>
                                <MaterialIcons name="check" size={12} color={theme.success} />
                                <Text variant="caption" color={theme.success} weight="600" style={{ fontSize: 10 }}>
                                    ÇÖZÜLDÜ
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Show description in header if collapsed (optional) or short status */}
                    {!isExpanded && !step.is_completed && isActive && (
                        <Text variant="caption" color={theme.textSecondary} numberOfLines={1}>
                            Dokunarak detayları gör
                        </Text>
                    )}
                </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {onEdit && (
                    <TouchableOpacity
                        onPress={(e) => {
                            e.stopPropagation();
                            onEdit();
                        }}
                        style={{ padding: 8, marginRight: 4 }}
                    >
                        <MaterialIcons name="edit" size={20} color={theme.textSecondary} />
                    </TouchableOpacity>
                )}
                <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={24}
                    color={theme.textMuted}
                />
            </View>
        </TouchableOpacity>
    );
};
