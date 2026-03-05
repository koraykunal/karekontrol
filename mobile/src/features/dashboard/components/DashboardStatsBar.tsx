import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/src/components/common/Text';
import { Colors, Spacing, BorderRadius } from '@/src/constants/theme';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/src/api/services/dashboard.service';
import { useAuthStore } from '@/src/store/zustand/auth.store';
import { UserRole } from '@/src/api/types/enums';

export function DashboardStatsBar() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const user = useAuthStore(state => state.user);
    const isManager = user?.role === UserRole.MANAGER || user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;

    const { data: stats } = useQuery({
        queryKey: ['dashboardStats'],
        queryFn: () => dashboardService.getStats(),
        staleTime: 5 * 60 * 1000,
    });

    const { data: managerStats } = useQuery({
        queryKey: ['managerStats'],
        queryFn: () => dashboardService.getManagerStats(),
        enabled: isManager,
        staleTime: 5 * 60 * 1000,
    });

    const dashData = (stats as any)?.data || stats;
    const mgrData = (managerStats as any)?.data || managerStats;

    const cards = [
        {
            icon: 'warning-outline' as const,
            label: 'Açık Sorunlar',
            value: mgrData?.open_issues ?? dashData?.compliance_issues ?? 0,
            color: theme.error,
            bg: theme.errorLight,
        },
        {
            icon: 'checkmark-circle-outline' as const,
            label: 'Tamamlanan',
            value: mgrData?.completed_procedures_last_30_days ?? dashData?.completed_assignments ?? 0,
            color: theme.success,
            bg: theme.successLight,
        },
        {
            icon: 'time-outline' as const,
            label: 'Bekleyen',
            value: mgrData?.pending_procedures ?? dashData?.pending_assignments ?? 0,
            color: theme.warning,
            bg: '#fef3c7',
        },
        ...(mgrData ? [{
            icon: 'shield-checkmark-outline' as const,
            label: 'Uyumluluk',
            value: `${mgrData.compliance_rate}%`,
            color: theme.primary,
            bg: theme.primaryLight,
        }] : []),
    ];

    if (!dashData && !mgrData) return null;

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            style={styles.container}
        >
            {cards.map((card, i) => (
                <View key={i} style={[styles.card, { backgroundColor: card.bg }]}>
                    <Ionicons name={card.icon} size={18} color={card.color} />
                    <Text variant="h3" weight="700" color={card.color} style={styles.value}>
                        {card.value}
                    </Text>
                    <Text variant="caption" color={theme.textSecondary} numberOfLines={1}>
                        {card.label}
                    </Text>
                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        maxHeight: 90,
    },
    scrollContent: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        gap: Spacing.sm,
    },
    card: {
        width: 100,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.sm,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    value: {
        marginVertical: 2,
    },
});
