import React, { useCallback } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

import { Text } from '@/src/components/common/Text';
import { Card } from '@/src/components/common/Card';
import { Colors, Spacing, BorderRadius } from '@/src/constants/theme';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { useProcedureLogs } from '@/src/features/procedures/hooks/queries';
import type { ProcedureLog } from '@/src/api/types/procedure.types';

const STATUS_COLORS: Record<string, string> = {
    in_progress: '#3b82f6',
    completed: '#22c55e',
    cancelled: '#6b7280',
    pending: '#f59e0b',
};

const STATUS_LABELS: Record<string, string> = {
    in_progress: 'Devam Ediyor',
    completed: 'Tamamlandı',
    cancelled: 'İptal',
    pending: 'Bekliyor',
};

export default function ProcedureLogsScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const { data, isLoading, refetch } = useProcedureLogs();

    const logs: ProcedureLog[] = (data as any)?.data || [];

    const handleLogPress = useCallback((log: ProcedureLog) => {
        router.push(`/(main)/execution/${log.id}`);
    }, [router]);

    const renderItem = useCallback(({ item }: { item: ProcedureLog }) => {
        const statusColor = STATUS_COLORS[item.status] || '#6b7280';

        return (
            <TouchableOpacity onPress={() => handleLogPress(item)}>
                <Card style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                            <Text variant="caption" weight="600" color={statusColor}>
                                {STATUS_LABELS[item.status] || item.status}
                            </Text>
                        </View>
                        {item.completion_percentage > 0 && (
                            <Text variant="caption" weight="600" color={theme.textSecondary}>
                                %{item.completion_percentage}
                            </Text>
                        )}
                    </View>

                    <Text weight="600" numberOfLines={2} style={styles.title}>
                        {item.procedure_title}
                    </Text>

                    {item.entity_name && (
                        <View style={styles.entityRow}>
                            <Ionicons name="cube-outline" size={14} color={theme.textSecondary} />
                            <Text variant="caption" color={theme.textSecondary} style={styles.entityName}>
                                {item.entity_name}
                            </Text>
                        </View>
                    )}

                    <View style={styles.footer}>
                        <Text variant="caption" color={theme.textMuted}>
                            {item.started_at
                                ? format(new Date(item.started_at), 'd MMM yyyy', { locale: tr })
                                : format(new Date(item.created_at), 'd MMM yyyy', { locale: tr })
                            }
                        </Text>
                        {item.assigned_to_name && (
                            <Text variant="caption" color={theme.textSecondary}>
                                {item.assigned_to_name}
                            </Text>
                        )}
                    </View>
                </Card>
            </TouchableOpacity>
        );
    }, [handleLogPress, theme]);

    return (
        <View style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
            <Stack.Screen options={{
                headerShown: true,
                title: 'Prosedürler',
                headerShadowVisible: false,
                headerStyle: { backgroundColor: theme.backgroundSecondary },
                headerTintColor: theme.text,
                headerTitleStyle: { fontWeight: '600' },
            }} />

            <FlatList
                data={logs}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
                ListEmptyComponent={
                    !isLoading ? (
                        <View style={styles.empty}>
                            <Ionicons name="clipboard-outline" size={48} color={theme.textMuted} />
                            <Text color={theme.textMuted} style={styles.emptyText}>
                                Prosedür kaydı bulunamadı
                            </Text>
                        </View>
                    ) : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    listContent: {
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.xxxl,
    },
    card: {
        marginBottom: Spacing.sm,
        padding: Spacing.md,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xs,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: BorderRadius.full,
        gap: 4,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    title: { marginBottom: 4 },
    entityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    entityName: { flex: 1 },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: Spacing.xs,
    },
    empty: {
        alignItems: 'center',
        paddingTop: Spacing.xxxl,
        gap: Spacing.sm,
    },
    emptyText: { marginTop: Spacing.xs },
});
