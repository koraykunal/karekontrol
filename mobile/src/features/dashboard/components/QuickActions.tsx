import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/src/components/common/Text';
import { Colors, Spacing } from '@/src/constants/theme';
import { useColorScheme } from '@/src/hooks/use-color-scheme';

interface QuickActionsProps {
    onProceduresPress: () => void;
    onEntitiesPress: () => void;
    onIssuesPress: () => void;
}

export function QuickActions({ onProceduresPress, onEntitiesPress, onIssuesPress }: QuickActionsProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const actions = [
        { icon: 'clipboard-outline' as const, label: 'Prosedürler', color: theme.primary, onPress: onProceduresPress },
        { icon: 'cube-outline' as const, label: 'Varlıklar', color: theme.secondary, onPress: onEntitiesPress },
        { icon: 'warning-outline' as const, label: 'Sorunlar', color: theme.error, onPress: onIssuesPress },
    ];

    return (
        <View style={styles.container}>
            {actions.map((action, i) => (
                <TouchableOpacity
                    key={i}
                    style={styles.actionButton}
                    onPress={action.onPress}
                >
                    <Ionicons name={action.icon} size={22} color={action.color} />
                    <Text variant="caption" weight="500" color={theme.textSecondary} style={styles.label}>
                        {action.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
    },
    actionButton: {
        alignItems: 'center',
        gap: 6,
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.md,
    },
    label: {
        fontSize: 11,
    },
});
