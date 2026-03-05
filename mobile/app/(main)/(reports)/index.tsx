import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { Text } from '@/src/components/common/Text';
import { Card } from '@/src/components/common/Card';
import { Colors, Spacing, BorderRadius } from '@/src/constants/theme';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { reportEndpoints } from '@/src/api/endpoints/report.endpoints';
import { REPORT_STATUS_COLORS, REPORT_STATUS_LABELS, REPORT_TYPE_LABELS } from '@/src/constants/report';
import type { Report } from '@/src/api/types/report.types';
import type { PaginatedResponse } from '@/src/api/types/common.types';
import { ReportStatus } from '@/src/api/types/enums';

const FILTERS = [
    { value: 'ALL' as const, label: 'Tümü' },
    { value: ReportStatus.COMPLETED, label: 'Tamamlanan' },
    { value: ReportStatus.GENERATING, label: 'Oluşturulan' },
    { value: ReportStatus.FAILED, label: 'Başarısız' },
];

export default function ReportsListScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const [statusFilter, setStatusFilter] = useState<ReportStatus | 'ALL'>('ALL');
    const [refreshing, setRefreshing] = useState(false);

    const { data, isLoading, refetch } = useQuery<PaginatedResponse<Report>>({
        queryKey: ['reports', statusFilter],
        queryFn: async () => {
            const params: Record<string, any> = { page_size: 50 };
            if (statusFilter !== 'ALL') params.status = statusFilter;
            const response = await reportEndpoints.getReports(params);
            return response.data;
        },
    });

    const reports: Report[] = data?.data ?? [];

    useFocusEffect(
        useCallback(() => {
            refetch();
        }, [refetch])
    );

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    const handleReportPress = useCallback((report: Report) => {
        router.push(`/(main)/(reports)/${report.id}` as any);
    }, [router]);

    const renderItem = useCallback(({ item }: { item: Report }) => {
        const statusColor = REPORT_STATUS_COLORS[item.status] || '#6b7280';
        const completionRate = item.total_procedures > 0
            ? Math.round((item.completed_procedures / item.total_procedures) * 100)
            : 0;

        return (
            <TouchableOpacity onPress={() => handleReportPress(item)} activeOpacity={0.8}>
                <Card style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.typeIcon, { backgroundColor: statusColor + '20' }]}>
                            <Ionicons
                                name={item.report_type === 'PROCEDURE' ? 'document-text-outline' : 'bar-chart-outline'}
                                size={22}
                                color={statusColor}
                            />
                        </View>
                        <View style={styles.cardTitleArea}>
                            <Text variant="body" weight="600" numberOfLines={1}>{item.title}</Text>
                            <Text variant="caption" color={theme.textSecondary}>
                                {REPORT_TYPE_LABELS[item.report_type] || item.report_type}
                            </Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                            <Text variant="caption" weight="600" color={statusColor}>
                                {REPORT_STATUS_LABELS[item.status] || item.status}
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: theme.border }]} />

                    <View style={styles.cardStats}>
                        <View style={styles.statItem}>
                            <Text variant="caption" color={theme.textMuted}>Dönem</Text>
                            <Text variant="bodySmall" weight="600">
                                {item.period_month}/{item.period_year}
                            </Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text variant="caption" color={theme.textMuted}>Uyum</Text>
                            <Text variant="bodySmall" weight="600">
                                {item.completed_procedures}/{item.total_procedures} (%{completionRate})
                            </Text>
                        </View>
                        {item.non_compliance_count > 0 && (
                            <View style={styles.statItem}>
                                <Text variant="caption" color={theme.textMuted}>Uygunsuzluk</Text>
                                <Text variant="bodySmall" weight="600" color="#ef4444">
                                    {item.non_compliance_count}
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.cardFooter}>
                        <Text variant="caption" color={theme.textMuted}>
                            {new Date(item.created_at).toLocaleDateString('tr-TR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                            })}
                        </Text>
                        {item.organization_name && (
                            <Text variant="caption" color={theme.textSecondary} numberOfLines={1}>
                                {item.organization_name}
                            </Text>
                        )}
                    </View>
                </Card>
            </TouchableOpacity>
        );
    }, [handleReportPress, theme]);

    return (
        <View style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
            <Stack.Screen options={{
                headerShown: true,
                title: 'Raporlar',
                headerShadowVisible: false,
                headerStyle: { backgroundColor: theme.backgroundSecondary },
                headerTintColor: theme.text,
                headerTitleStyle: { fontWeight: '600' },
            }} />

            <View style={styles.filterRow}>
                {FILTERS.map((f) => (
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

            {isLoading && !refreshing ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <FlatList
                    data={reports}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="document-text-outline" size={48} color={theme.textMuted} />
                            <Text color={theme.textMuted} style={styles.emptyText}>
                                Henüz rapor oluşturulmamış
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        gap: Spacing.xs,
    },
    filterChip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs + 2,
        borderRadius: BorderRadius.round,
    },
    listContent: {
        padding: Spacing.md,
        paddingBottom: 40,
    },
    card: {
        marginBottom: Spacing.sm,
        padding: Spacing.md,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    typeIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.sm,
    },
    cardTitleArea: {
        flex: 1,
        marginRight: Spacing.sm,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: BorderRadius.round,
        gap: 4,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    divider: {
        height: 1,
        marginVertical: Spacing.sm,
    },
    cardStats: {
        flexDirection: 'row',
        gap: Spacing.lg,
    },
    statItem: {
        gap: 2,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Spacing.sm,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    empty: {
        alignItems: 'center',
        paddingTop: 80,
        gap: Spacing.md,
    },
    emptyText: {
        marginTop: Spacing.sm,
    },
});
