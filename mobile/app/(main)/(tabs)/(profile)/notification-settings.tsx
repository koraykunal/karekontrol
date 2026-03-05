import React from 'react';
import { View, ScrollView, StyleSheet, Switch, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Text } from '@/src/components/common/Text';
import { Card } from '@/src/components/common/Card';
import { Colors, Spacing, BorderRadius } from '@/src/constants/theme';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { notificationEndpoints } from '@/src/api/endpoints/notification.endpoints';

interface NotificationPrefs {
    procedure_due_enabled: boolean;
    procedure_overdue_enabled: boolean;
    issue_enabled: boolean;
    help_request_enabled: boolean;
    push_enabled: boolean;
    reminder_days_before: number;
    quiet_hours_enabled: boolean;
    quiet_hours_start: string | null;
    quiet_hours_end: string | null;
}

export default function NotificationSettingsScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['notificationPreferences'],
        queryFn: async () => {
            const response = await notificationEndpoints.getPreferences();
            return (response.data as any)?.data as NotificationPrefs;
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (updates: Partial<NotificationPrefs>) => {
            const response = await notificationEndpoints.updatePreferences(updates);
            return (response.data as any)?.data;
        },
        onSuccess: (newData) => {
            queryClient.setQueryData(['notificationPreferences'], newData);
        },
    });

    const toggle = (key: keyof NotificationPrefs) => {
        if (!data) return;
        updateMutation.mutate({ [key]: !data[key] });
    };

    const adjustReminderDays = (delta: number) => {
        if (!data) return;
        const newVal = Math.max(1, Math.min(7, (data.reminder_days_before ?? 3) + delta));
        updateMutation.mutate({ reminder_days_before: newVal });
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: theme.backgroundSecondary }]}>
                <Stack.Screen options={{
                    headerShown: true,
                    title: 'Bildirim Tercihleri',
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: theme.backgroundSecondary },
                    headerTintColor: theme.text,
                    headerTitleStyle: { fontWeight: '600' },
                }} />
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    const prefs = data;

    return (
        <View style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
            <Stack.Screen options={{
                    headerShown: true,
                    title: 'Bildirim Tercihleri',
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: theme.backgroundSecondary },
                    headerTintColor: theme.text,
                    headerTitleStyle: { fontWeight: '600' },
                }} />

            <ScrollView contentContainerStyle={styles.content}>
                {/* Master toggle */}
                <Card style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                    <SettingRow
                        theme={theme}
                        label="Push Bildirimleri"
                        description="Tüm push bildirimlerini aç/kapat"
                        value={prefs?.push_enabled ?? true}
                        onToggle={() => toggle('push_enabled')}
                    />
                </Card>

                {/* Category toggles */}
                <Text variant="caption" weight="600" color={theme.textSecondary} style={styles.sectionTitle}>
                    KATEGORİLER
                </Text>
                <Card style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                    <SettingRow
                        theme={theme}
                        label="Prosedür Hatırlatmaları"
                        description="Yaklaşan prosedür bildirimleri"
                        value={prefs?.procedure_due_enabled ?? true}
                        onToggle={() => toggle('procedure_due_enabled')}
                    />
                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                    <SettingRow
                        theme={theme}
                        label="Gecikmiş Prosedürler"
                        description="Vadesi geçmiş prosedür uyarıları"
                        value={prefs?.procedure_overdue_enabled ?? true}
                        onToggle={() => toggle('procedure_overdue_enabled')}
                    />
                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                    <SettingRow
                        theme={theme}
                        label="Uygunsuzluk Bildirimleri"
                        description="Yeni uygunsuzluk ve güncellemeler"
                        value={prefs?.issue_enabled ?? true}
                        onToggle={() => toggle('issue_enabled')}
                    />
                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                    <SettingRow
                        theme={theme}
                        label="Yardım Talepleri"
                        description="Gelen ve yanıtlanan talepler"
                        value={prefs?.help_request_enabled ?? true}
                        onToggle={() => toggle('help_request_enabled')}
                    />
                </Card>

                {/* Quiet hours */}
                <Text variant="caption" weight="600" color={theme.textSecondary} style={styles.sectionTitle}>
                    SESSİZ SAATLER
                </Text>
                <Card style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                    <SettingRow
                        theme={theme}
                        label="Sessiz Saatler"
                        description={prefs?.quiet_hours_start && prefs?.quiet_hours_end
                            ? `${prefs.quiet_hours_start.slice(0, 5)} - ${prefs.quiet_hours_end.slice(0, 5)}`
                            : 'Acil bildirimler hariç bildirimleri sustur'
                        }
                        value={prefs?.quiet_hours_enabled ?? false}
                        onToggle={() => toggle('quiet_hours_enabled')}
                    />
                </Card>

                {/* Reminder days */}
                <Text variant="caption" weight="600" color={theme.textSecondary} style={styles.sectionTitle}>
                    HATIRLATMA
                </Text>
                <Card style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <Text weight="600">Hatırlatma Günü</Text>
                            <Text variant="caption" color={theme.textSecondary}>
                                Prosedür tarihinden kaç gün önce hatırlat
                            </Text>
                        </View>
                        <View style={styles.stepperContainer}>
                            <TouchableOpacity
                                style={[styles.stepperBtn, { backgroundColor: theme.border }]}
                                onPress={() => adjustReminderDays(-1)}
                                disabled={(prefs?.reminder_days_before ?? 3) <= 1}
                            >
                                <Text weight="700" color={theme.text}>−</Text>
                            </TouchableOpacity>
                            <View style={[styles.daysBadge, { backgroundColor: theme.primaryLight }]}>
                                <Text weight="700" color={theme.primary}>
                                    {prefs?.reminder_days_before ?? 3}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.stepperBtn, { backgroundColor: theme.border }]}
                                onPress={() => adjustReminderDays(1)}
                                disabled={(prefs?.reminder_days_before ?? 3) >= 7}
                            >
                                <Text weight="700" color={theme.text}>+</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Card>
            </ScrollView>
        </View>
    );
}

function SettingRow({ theme, label, description, value, onToggle }: {
    theme: any;
    label: string;
    description: string;
    value: boolean;
    onToggle: () => void;
}) {
    return (
        <View style={styles.row}>
            <View style={{ flex: 1 }}>
                <Text weight="600">{label}</Text>
                <Text variant="caption" color={theme.textSecondary}>{description}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: theme.border, true: theme.primary + '60' }}
                thumbColor={value ? theme.primary : '#f4f3f4'}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { justifyContent: 'center', alignItems: 'center' },
    content: { padding: Spacing.md, paddingBottom: Spacing.xxxl },
    sectionTitle: { marginTop: Spacing.lg, marginBottom: Spacing.xs, marginLeft: 4 },
    card: { padding: Spacing.md },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    divider: { height: 1, marginVertical: Spacing.sm },
    stepperContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    stepperBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    daysBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
