import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { File, Paths } from 'expo-file-system';
import { fetch as expoFetch } from 'expo/fetch';
import * as Sharing from 'expo-sharing';
import { useQuery } from '@tanstack/react-query';

import { Screen } from '@/src/components/common/Screen';
import { Text } from '@/src/components/common/Text';
import { Button } from '@/src/components/common/Button';
import { Card } from '@/src/components/common/Card';
import { Colors, Spacing, BorderRadius } from '@/src/constants/theme';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { reportEndpoints } from '@/src/api/endpoints/report.endpoints';
import { tokenStorage } from '@/src/features/auth/utils/token-storage';
import { ENV } from '@/src/constants/env';
import { REPORT_STATUS_COLORS, REPORT_STATUS_LABELS, REPORT_TYPE_LABELS } from '@/src/constants/report';
import type { Report } from '@/src/api/types/report.types';
import { ReportStatus } from '@/src/api/types/enums';

const MAX_POLL_COUNT = 60;

export default function ReportDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const [downloading, setDownloading] = useState(false);

    const reportId = Number(id);

    const { data: report, isLoading } = useQuery<Report>({
        queryKey: ['reports', 'detail', reportId],
        queryFn: async () => {
            const response = await reportEndpoints.getReport(reportId);
            return response.data;
        },
        enabled: !isNaN(reportId) && reportId > 0,
        refetchInterval: (query) => {
            const data = query.state.data;
            if (!data) return false;
            const isPolling = data.status === ReportStatus.PENDING || data.status === ReportStatus.GENERATING;
            if (!isPolling) return false;
            const fetchCount = query.state.dataUpdateCount;
            if (fetchCount > MAX_POLL_COUNT) return false;
            return 3000;
        },
    });

    const handleDownloadAndShare = async () => {
        if (!report || !report.file) return;

        try {
            setDownloading(true);
            let token = await tokenStorage.getAccessToken();
            const downloadUrl = `${ENV.API_BASE_URL}/reports/${report.id}/download/`;
            const fileName = `${report.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
            const outputFile = new File(Paths.cache, fileName);

            let response = await expoFetch(downloadUrl, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.status === 401) {
                const refreshToken = await tokenStorage.getRefreshToken();
                if (refreshToken) {
                    const refreshRes = await expoFetch(`${ENV.API_BASE_URL}/auth/refresh/`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ refresh_token: refreshToken }),
                    });
                    if (refreshRes.ok) {
                        const refreshData = await refreshRes.json();
                        await tokenStorage.setAccessToken(refreshData.access_token);
                        token = refreshData.access_token;
                        response = await expoFetch(downloadUrl, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                    }
                }
            }

            if (!response.ok) {
                Alert.alert('Hata', 'PDF indirilemedi.');
                return;
            }

            outputFile.write(await response.bytes());

            const canShare = await Sharing.isAvailableAsync();
            if (canShare) {
                await Sharing.shareAsync(outputFile.uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: report.title,
                    UTI: 'com.adobe.pdf',
                });
            } else {
                Alert.alert('Bilgi', 'PDF indirildi ancak paylaşım bu cihazda desteklenmiyor.');
            }
        } catch (error: any) {
            Alert.alert('Hata', error.message || 'PDF indirme başarısız.');
        } finally {
            setDownloading(false);
        }
    };

    if (isLoading) {
        return (
            <Screen center style={{ backgroundColor: theme.backgroundSecondary }}>
                <Text style={{ marginTop: 12 }} color={theme.textSecondary}>Rapor yükleniyor...</Text>
            </Screen>
        );
    }

    if (!report) return null;

    const isGenerating = report.status === ReportStatus.PENDING || report.status === ReportStatus.GENERATING;
    const isReady = report.status === ReportStatus.COMPLETED;
    const isFailed = report.status === ReportStatus.FAILED;
    const statusColor = REPORT_STATUS_COLORS[report.status] || '#6b7280';
    const completionRate = report.total_procedures > 0
        ? Math.round((report.completed_procedures / report.total_procedures) * 100)
        : 0;

    return (
        <Screen safeArea={false} padding={false} style={{ backgroundColor: theme.backgroundSecondary }}>
            <Stack.Screen options={{
                title: 'Rapor Detayı',
                headerShadowVisible: false,
                headerStyle: { backgroundColor: theme.backgroundSecondary },
                headerTintColor: theme.text,
                headerTitleStyle: { fontWeight: '600' },
            }} />

            <ScrollView contentContainerStyle={styles.content}>
                <Card style={[styles.headerCard, { backgroundColor: theme.cardBackground }]}>
                    <View style={styles.headerTop}>
                        <View style={[styles.headerIcon, { backgroundColor: statusColor + '20' }]}>
                            <Ionicons
                                name={report.report_type === 'PROCEDURE' ? 'document-text-outline' : 'bar-chart-outline'}
                                size={28}
                                color={statusColor}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text variant="h3">{report.title}</Text>
                            <View style={styles.subtitleRow}>
                                {report.organization_name ? (
                                    <Text variant="caption" color={theme.textSecondary}>
                                        {report.organization_name}
                                    </Text>
                                ) : null}
                                {report.department_name && (
                                    <Text variant="caption" color={theme.textSecondary}>
                                        {' '}{report.department_name}
                                    </Text>
                                )}
                            </View>
                        </View>
                    </View>

                    <View style={[styles.badgeRow, { marginTop: Spacing.sm }]}>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                            <Text variant="caption" weight="600" color={statusColor}>
                                {REPORT_STATUS_LABELS[report.status] || report.status}
                            </Text>
                        </View>
                        <View style={[styles.typeBadge, { backgroundColor: theme.primary + '15' }]}>
                            <Text variant="caption" weight="600" color={theme.primary}>
                                {REPORT_TYPE_LABELS[report.report_type] || report.report_type}
                            </Text>
                        </View>
                    </View>
                </Card>

                <View style={styles.statsGrid}>
                    <Card style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
                        <Text variant="caption" color={theme.textMuted}>Dönem</Text>
                        <Text variant="h3">{report.period_month}/{report.period_year}</Text>
                    </Card>
                    <Card style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
                        <Text variant="caption" color={theme.textMuted}>Tamamlanma</Text>
                        <Text variant="h3">{report.completed_procedures}/{report.total_procedures}</Text>
                        <Text variant="caption" color={theme.textSecondary}>%{completionRate}</Text>
                    </Card>
                    <Card style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
                        <Text variant="caption" color={theme.textMuted}>Uygunsuzluk</Text>
                        <Text variant="h3" color={report.non_compliance_count > 0 ? '#ef4444' : undefined}>
                            {report.non_compliance_count}
                        </Text>
                    </Card>
                    <Card style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
                        <Text variant="caption" color={theme.textMuted}>Bekleyen</Text>
                        <Text variant="h3">{report.pending_procedures}</Text>
                    </Card>
                </View>

                <Card style={[styles.infoCard, { backgroundColor: theme.cardBackground }]}>
                    {report.generated_by_name && (
                        <View style={styles.infoRow}>
                            <Ionicons name="person-outline" size={16} color={theme.textSecondary} />
                            <Text variant="bodySmall" color={theme.textSecondary}>Oluşturan:</Text>
                            <Text variant="bodySmall" weight="600">{report.generated_by_name}</Text>
                        </View>
                    )}
                    <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} />
                        <Text variant="bodySmall" color={theme.textSecondary}>Tarih:</Text>
                        <Text variant="bodySmall" weight="600">
                            {new Date(report.created_at).toLocaleDateString('tr-TR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </Text>
                    </View>
                    {report.file_size != null && report.file_size > 0 && (
                        <View style={styles.infoRow}>
                            <Ionicons name="document-outline" size={16} color={theme.textSecondary} />
                            <Text variant="bodySmall" color={theme.textSecondary}>Boyut:</Text>
                            <Text variant="bodySmall" weight="600">
                                {(report.file_size / 1024).toFixed(0)} KB
                            </Text>
                        </View>
                    )}
                </Card>

                {isGenerating && (
                    <Card style={[styles.statusCard, { backgroundColor: theme.primary + '10', borderColor: theme.primary, borderWidth: 1 }]}>
                        <Text variant="body" weight="600" color={theme.primary} style={{ marginTop: Spacing.sm }}>
                            Rapor oluşturuluyor...
                        </Text>
                        <Text variant="caption" color={theme.textSecondary} style={{ marginTop: Spacing.xs }}>
                            Bu sayfa otomatik olarak güncellenecek
                        </Text>
                    </Card>
                )}

                {isFailed && (
                    <Card style={[styles.statusCard, { backgroundColor: '#FEF2F2', borderColor: '#ef4444', borderWidth: 1 }]}>
                        <Ionicons name="close-circle" size={32} color="#ef4444" />
                        <Text variant="body" weight="600" color="#DC2626" style={{ marginTop: Spacing.sm }}>
                            Rapor oluşturma başarısız
                        </Text>
                        {report.error_message && (
                            <Text variant="caption" color="#EF4444" style={{ marginTop: Spacing.xs }}>
                                {report.error_message}
                            </Text>
                        )}
                    </Card>
                )}

                {isReady && (
                    <View style={styles.downloadSection}>
                        <Button
                            title={downloading ? "İndiriliyor..." : "PDF İndir ve Paylaş"}
                            variant="primary"
                            fullWidth
                            onPress={handleDownloadAndShare}
                            disabled={downloading}
                            loading={downloading}
                        />
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: Spacing.md,
    },
    headerCard: {
        padding: Spacing.md,
        marginBottom: Spacing.md,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    subtitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    badgeRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
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
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: BorderRadius.round,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        padding: Spacing.md,
        gap: 2,
    },
    infoCard: {
        padding: Spacing.md,
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    statusCard: {
        padding: Spacing.xl,
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    downloadSection: {
        marginTop: Spacing.sm,
    },
});
