import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/src/components/common/Text';
import { Colors, Spacing, BorderRadius } from '@/src/constants/theme';
import { useColorScheme } from '@/src/hooks/use-color-scheme';

interface ProcedureLog {
    id: number;
    procedure_title: string;
    started_at: string;
    completion_percentage: number;
    status: string;
}

interface ActiveProceduresBarProps {
    procedures: ProcedureLog[];
    onProcedurePress: (procedure: ProcedureLog) => void;
}

export function ActiveProceduresBar({ procedures, onProcedurePress }: ActiveProceduresBarProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    if (!procedures || procedures.length === 0) return null;

    return (
        <View style={styles.container}>
            <Text variant="caption" weight="600" color={theme.textSecondary} style={styles.label}>
                DEVAM EDEN PROSEDÜRLER ({procedures.length})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {procedures.map((proc) => (
                    <TouchableOpacity
                        key={proc.id}
                        style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.primaryLight }]}
                        onPress={() => onProcedurePress(proc)}
                    >
                        <View style={styles.header}>
                            <Ionicons name="play-circle" size={20} color={theme.primary} />
                            <Text variant="caption" weight="600" color={theme.primary} style={styles.status}>
                                {proc.completion_percentage}%
                            </Text>
                        </View>
                        <Text variant="caption" weight="600" numberOfLines={2} style={styles.title}>
                            {proc.procedure_title}
                        </Text>
                        <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        width: `${proc.completion_percentage}%`,
                                        backgroundColor: theme.primary
                                    }
                                ]}
                            />
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.md,
    },
    label: {
        marginLeft: Spacing.lg,
        marginBottom: Spacing.xs,
        marginTop: Spacing.sm,
    },
    scrollContent: {
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.sm,
    },
    card: {
        width: 160,
        padding: Spacing.sm,
        borderRadius: BorderRadius.md,
        marginRight: Spacing.sm,
        borderWidth: 1,
        borderLeftWidth: 4,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    status: {
        fontSize: 10,
    },
    title: {
        marginBottom: 8,
    },
    progressBar: {
        height: 3,
        borderRadius: 1.5,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 1.5,
    },
});
