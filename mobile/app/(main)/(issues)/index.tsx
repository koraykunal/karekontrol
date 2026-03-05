import React, { useState, useCallback } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

import { Text } from '@/src/components/common/Text';
import { Card } from '@/src/components/common/Card';
import { Colors, Spacing, BorderRadius } from '@/src/constants/theme';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { issueService } from '@/src/api/services/issue.service';
import { IssueStatus, IssueSeverity } from '@/src/api/types/enums';
import type { NonComplianceIssue } from '@/src/api/types/issue.types';

const STATUS_FILTERS: { label: string; value: IssueStatus | 'ALL' }[] = [
    { label: 'Tümü', value: 'ALL' },
    { label: 'Açık', value: IssueStatus.OPEN },
    { label: 'Çözüldü', value: IssueStatus.RESOLVED },
];

const SEVERITY_COLORS: Record<string, string> = {
    [IssueSeverity.CRITICAL]: '#dc2626',
    [IssueSeverity.HIGH]: '#ea580c',
    [IssueSeverity.MEDIUM]: '#d97706',
    [IssueSeverity.LOW]: '#65a30d',
};

const STATUS_COLORS: Record<string, string> = {
    [IssueStatus.OPEN]: '#ef4444',
    [IssueStatus.RESOLVED]: '#22c55e',
    [IssueStatus.VERIFIED]: '#3b82f6',
    [IssueStatus.ESCALATED]: '#dc2626',
    [IssueStatus.CLOSED]: '#6b7280',
};

export default function IssuesListScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const [statusFilter, setStatusFilter] = useState<IssueStatus | 'ALL'>('ALL');

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['issues', statusFilter],
        queryFn: async () => {
            const params = statusFilter !== 'ALL' ? { status: statusFilter } : undefined;
            return issueService.getIssues(params);
        },
    });

    const issues: NonComplianceIssue[] = (data as any)?.data || [];

    const handleIssuePress = useCallback((issue: NonComplianceIssue) => {
        router.push(`/(main)/execution/issues/${issue.id}`);
    }, [router]);

    const renderItem = useCallback(({ item }: { item: NonComplianceIssue }) => (
        <TouchableOpacity onPress={() => handleIssuePress(item)}>
            <Card style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                <View style={styles.cardHeader}>
                    <View style={[styles.severityBadge, { backgroundColor: SEVERITY_COLORS[item.severity] || '#6b7280' }]}>
                        <Text variant="caption" weight="700" color="#fff" style={styles.badgeText}>
                            {item.severity}
                        </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[item.status] || '#6b7280') + '20' }]}>
                        <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.status] || '#6b7280' }]} />
                        <Text variant="caption" weight="600" color={STATUS_COLORS[item.status] || '#6b7280'}>
                            {item.status}
                        </Text>
                    </View>
                </View>

                <Text weight="600" numberOfLines={2} style={styles.title}>
                    {item.title}
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
                        {format(new Date(item.created_at), 'd MMM yyyy', { locale: tr })}
                    </Text>
                    {item.assigned_to_name && (
                        <Text variant="caption" color={theme.textSecondary}>
                            {item.assigned_to_name}
                        </Text>
                    )}
                </View>
            </Card>
        </TouchableOpacity>
    ), [handleIssuePress, theme]);

    return (
        <View style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
            <Stack.Screen options={{
                headerShown: true,
                title: 'Uygunsuzluklar',
                headerShadowVisible: false,
                headerStyle: { backgroundColor: theme.backgroundSecondary },
                headerTintColor: theme.text,
                headerTitleStyle: { fontWeight: '600' },
                headerRight: () => (
                    <TouchableOpacity onPress={() => router.push('/(main)/(issues)/create' as any)}>
                        <Ionicons name="add-circle-outline" size={24} color={theme.primary} />
                    </TouchableOpacity>
                ),
            }} />

            <View style={styles.filterRow}>
                {STATUS_FILTERS.map((f) => (
                    <TouchableOpacity
                        key={f.value}
                        style={[
                            styles.filterChip,
                            statusFilter === f.value
                                ? { backgroundColor: theme.primary }
                                : { backgroundColor: theme.cardBackground, borderWidth: 1, borderColor: theme.border },
                        ]}
                        onPress={() => setStatusFilter(f.value)}
                    >
                        <Text
                            variant="caption"
                            weight="600"
                            color={statusFilter === f.value ? '#fff' : theme.textSecondary}
                        >
                            {f.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={issues}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
                ListEmptyComponent={
                    !isLoading ? (
                        <View style={styles.empty}>
                            <Ionicons name="checkmark-circle-outline" size={48} color={theme.textMuted} />
                            <Text color={theme.textMuted} style={styles.emptyText}>
                                Uygunsuzluk bulunamadı
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
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        gap: Spacing.xs,
    },
    filterChip: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 6,
        borderRadius: BorderRadius.full,
    },
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
    severityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
    },
    badgeText: { fontSize: 10 },
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
