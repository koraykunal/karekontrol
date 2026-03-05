import React, { useState, useCallback } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

import { Text } from '@/src/components/common/Text';
import { Card } from '@/src/components/common/Card';
import { Colors, Spacing, BorderRadius } from '@/src/constants/theme';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { issueService } from '@/src/api/services/issue.service';
import { HelpRequestStatus } from '@/src/api/types/enums';
import type { HelpRequest } from '@/src/api/types/issue.types';
import { useAuthStore } from '@/src/store/zustand/auth.store';

type TabType = 'incoming' | 'outgoing';

const STATUS_COLORS: Record<string, string> = {
    [HelpRequestStatus.PENDING]: '#f59e0b',
    [HelpRequestStatus.ACCEPTED]: '#3b82f6',
    [HelpRequestStatus.REJECTED]: '#ef4444',
    [HelpRequestStatus.COMPLETED]: '#22c55e',
};

const STATUS_LABELS: Record<string, string> = {
    [HelpRequestStatus.PENDING]: 'Bekliyor',
    [HelpRequestStatus.ACCEPTED]: 'Kabul Edildi',
    [HelpRequestStatus.REJECTED]: 'Reddedildi',
    [HelpRequestStatus.COMPLETED]: 'Tamamlandı',
};

export default function HelpRequestsScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const queryClient = useQueryClient();
    const user = useAuthStore(state => state.user);
    const [tab, setTab] = useState<TabType>('incoming');

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['helpRequests', tab],
        queryFn: () => issueService.getHelpRequests(
            tab === 'incoming'
                ? { to_department: user?.department }
                : { from_department: user?.department }
        ),
    });

    const respondMutation = useMutation({
        mutationFn: ({ id, status, notes }: { id: number; status: string; notes?: string }) =>
            issueService.respondToHelpRequest(id, status, notes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['helpRequests'] });
        },
    });

    const requests: HelpRequest[] = (data as any)?.data || [];

    const handleRespond = useCallback((hr: HelpRequest, status: string) => {
        Alert.alert(
            status === 'ACCEPTED' ? 'Kabul Et' : 'Reddet',
            `Bu yardım talebini ${status === 'ACCEPTED' ? 'kabul etmek' : 'reddetmek'} istediğinize emin misiniz?`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Evet',
                    onPress: () => respondMutation.mutate({ id: hr.id, status }),
                },
            ]
        );
    }, [respondMutation]);

    const renderItem = useCallback(({ item }: { item: HelpRequest }) => {
        const isIncoming = tab === 'incoming';
        const statusColor = STATUS_COLORS[item.status] || '#6b7280';

        return (
            <Card style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                <View style={styles.cardHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                        <Text variant="caption" weight="600" color={statusColor}>
                            {STATUS_LABELS[item.status] || item.status}
                        </Text>
                    </View>
                    <Text variant="caption" color={theme.textMuted}>
                        {format(new Date(item.created_at), 'd MMM', { locale: tr })}
                    </Text>
                </View>

                <View style={styles.deptRow}>
                    <Ionicons name="business-outline" size={14} color={theme.textSecondary} />
                    <Text variant="caption" color={theme.textSecondary}>
                        {isIncoming ? item.from_department_name : item.to_department_name}
                    </Text>
                    <Ionicons name="arrow-forward" size={12} color={theme.textMuted} />
                    <Text variant="caption" color={theme.textSecondary}>
                        {isIncoming ? item.to_department_name : item.from_department_name}
                    </Text>
                </View>

                <Text numberOfLines={3} style={styles.message}>
                    {item.message}
                </Text>

                {item.issue_title && (
                    <TouchableOpacity
                        style={styles.issueLink}
                        onPress={() => item.issue && router.push(`/(main)/execution/issues/${item.issue}`)}
                    >
                        <Ionicons name="link-outline" size={14} color={theme.primary} />
                        <Text variant="caption" color={theme.primary}>{item.issue_title}</Text>
                    </TouchableOpacity>
                )}

                {item.response_message && (
                    <View style={[styles.responseBox, { backgroundColor: theme.backgroundSecondary }]}>
                        <Text variant="caption" weight="600" color={theme.textSecondary}>Yanıt:</Text>
                        <Text variant="caption" color={theme.text}>{item.response_message}</Text>
                    </View>
                )}

                {isIncoming && item.status === HelpRequestStatus.PENDING && (
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: theme.success }]}
                            onPress={() => handleRespond(item, 'ACCEPTED')}
                        >
                            <Ionicons name="checkmark" size={16} color="#fff" />
                            <Text variant="caption" weight="600" color="#fff">Kabul Et</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: theme.error }]}
                            onPress={() => handleRespond(item, 'REJECTED')}
                        >
                            <Ionicons name="close" size={16} color="#fff" />
                            <Text variant="caption" weight="600" color="#fff">Reddet</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </Card>
        );
    }, [tab, theme, handleRespond, router]);

    return (
        <View style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
            <Stack.Screen options={{
                headerShown: true,
                title: 'Yardım Talepleri',
                headerShadowVisible: false,
                headerStyle: { backgroundColor: theme.backgroundSecondary },
                headerTintColor: theme.text,
                headerTitleStyle: { fontWeight: '600' },
            }} />

            {/* Tab selector */}
            <View style={[styles.tabRow, { backgroundColor: theme.cardBackground }]}>
                <TouchableOpacity
                    style={[styles.tab, tab === 'incoming' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
                    onPress={() => setTab('incoming')}
                >
                    <Text weight={tab === 'incoming' ? '700' : '400'} color={tab === 'incoming' ? theme.primary : theme.textSecondary}>
                        Gelen
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, tab === 'outgoing' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
                    onPress={() => setTab('outgoing')}
                >
                    <Text weight={tab === 'outgoing' ? '700' : '400'} color={tab === 'outgoing' ? theme.primary : theme.textSecondary}>
                        Giden
                    </Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={requests}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
                ListEmptyComponent={
                    !isLoading ? (
                        <View style={styles.empty}>
                            <Ionicons name="hand-left-outline" size={48} color={theme.textMuted} />
                            <Text color={theme.textMuted}>Yardım talebi bulunamadı</Text>
                        </View>
                    ) : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    tabRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: Spacing.sm,
    },
    listContent: {
        padding: Spacing.md,
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
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    deptRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: Spacing.xs,
    },
    message: { marginBottom: Spacing.xs },
    issueLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: Spacing.xs,
    },
    responseBox: {
        padding: Spacing.sm,
        borderRadius: BorderRadius.sm,
        marginTop: Spacing.xs,
        gap: 2,
    },
    actionRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginTop: Spacing.sm,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 8,
        borderRadius: BorderRadius.md,
    },
    empty: {
        alignItems: 'center',
        paddingTop: Spacing.xxxl,
        gap: Spacing.sm,
    },
});
