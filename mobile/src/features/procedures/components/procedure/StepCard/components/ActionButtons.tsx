import React from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Text } from '@/src/components/common/Text';
import { createStyles } from '../styles';
import type { CompletionStatus } from '../types';

interface ActionButtonsProps {
    selectedStatus: CompletionStatus;
    onStatusChange: (status: CompletionStatus) => void;
    isPending: boolean;
    theme: any;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
    selectedStatus,
    onStatusChange,
    isPending,
    theme,
}) => {
    const styles = createStyles(theme);

    const statusOptions: { key: CompletionStatus; label: string; icon: string; color: string }[] = [
        { key: 'compliant', label: 'Uygun', icon: 'check-circle', color: theme.success },
        { key: 'non_compliant', label: 'Uygunsuz', icon: 'cancel', color: theme.error },
        { key: 'not_applicable', label: 'Kontrol Dışı', icon: 'info', color: theme.warning },
    ];

    return (
        <View style={styles.actionRow}>
            {statusOptions.map(({ key, label, icon, color }) => {
                const isSelected = selectedStatus === key;
                return (
                    <TouchableOpacity
                        key={key}
                        style={[
                            styles.statusButton,
                            isSelected ? {
                                backgroundColor: color,
                                borderColor: color,
                                elevation: 4,
                                shadowColor: color,
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.3,
                                shadowRadius: 4,
                            } : {
                                borderColor: theme.border
                            },
                            isPending && { opacity: 0.5 }
                        ]}
                        onPress={() => onStatusChange(key)}
                        disabled={isPending}
                        activeOpacity={0.8}
                    >
                        <MaterialIcons
                            name={icon as any}
                            size={28}
                            color={isSelected ? '#FFF' : color}
                        />
                        <Text
                            weight="600"
                            style={[
                                styles.statusButtonText,
                                { color: isSelected ? '#FFF' : theme.text }
                            ]}
                        >
                            {label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};
