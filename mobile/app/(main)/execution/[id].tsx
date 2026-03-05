import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

import { Screen } from '@/src/components/common/Screen';
import { Text } from '@/src/components/common/Text';
import { Button } from '@/src/components/common/Button';
import { Card } from '@/src/components/common/Card';
import { Colors, Spacing } from '@/src/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { StepCard } from '@/src/features/procedures';
import { procedureService } from '@/src/api/services/procedure.service';
import { reportEndpoints } from '@/src/api/endpoints/report.endpoints';
import { useAuthStore } from '@/src/store/zustand/auth.store';
import { UserRole } from '@/src/api/types/enums';
import { ProcedureLog, StepLog } from '@/src/api/types/procedure.types';

export default function ProcedureDetailScreen() {
    const { id, title: paramsTitle, mode, entityId, focusStepId } = useLocalSearchParams();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const user = useAuthStore(state => state.user);
    const canGenerateReport = user?.role && [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER].includes(user.role as UserRole);

    const [log, setLog] = useState<ProcedureLog | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (id) {
            initializeProcedure();
        }
    }, [id]);

    const initializeProcedure = async () => {
        try {
            setLoading(true);
            let procedureLog: ProcedureLog;

            // Always fetching existing log now (EntityDetail handles creation)
            const res = await procedureService.getProcedureLog(Number(id));
            procedureLog = (res as any).data || res;

            // Ensure steps are sorted
            if (procedureLog?.step_logs) {
                procedureLog.step_logs.sort((a: StepLog, b: StepLog) =>
                    (a.step_order || 0) - (b.step_order || 0)
                );
            }

            setLog(procedureLog);
        } catch (error: any) {
            console.error('Procedure init failed', error);
            Alert.alert('Hata', error.response?.data?.detail || 'Prosedür detayları yüklenemedi.');
            router.canGoBack() ? router.back() : router.replace('/(main)/(tabs)/(dashboard)');
        } finally {
            setLoading(false);
        }
    };

    const handleStepComplete = async (stepId: number, data: { completion_status: string | null, notes?: string, photo_urls?: string[], severity?: string }) => {
        if (!log || !data.completion_status) return;

        const statusMap: Record<string, string> = {
            'compliant': 'COMPLIANT',
            'non_compliant': 'NON_COMPLIANT',
            'not_applicable': 'NOT_APPLICABLE',
        };
        const backendStatus = statusMap[data.completion_status] || data.completion_status.toUpperCase();

        try {
            const res = await procedureService.completeStep(log.id, stepId, {
                completion_status: backendStatus,
                notes: data.notes,
                photo_urls: data.photo_urls,
                severity: data.severity,
            });

            const updatedStep = (res as any).data || res;

            // Update local state
            setLog(prev => {
                if (!prev) return null;
                const newStepLogs = (prev as any).step_logs.map((s: StepLog) =>
                    s.id === stepId
                        ? { ...s, ...updatedStep, is_completed: true, completion_status: backendStatus }
                        : s
                );
                return { ...prev, step_logs: newStepLogs };
            });

        } catch (error: any) {
            console.error('Step completion failed', error);
            throw error; // Let StepCard handle error alert
        }
    };

    const handleFinishProcedure = async () => {
        if (!log) return;

        const uncompletedSteps = (log.step_logs || []).filter((s: StepLog) => !s.is_completed).length;

        const performCompletion = () => {
            setSubmitting(true);
            procedureService.completeProcedure(log!.id)
                .then(() => {
                    Alert.alert('Tamamlandı', 'Prosedür başarıyla tamamlandı.', [
                        { text: 'Tamam', onPress: () => router.canGoBack() ? router.back() : router.replace('/(main)/(tabs)/(dashboard)') }
                    ]);
                })
                .catch(err => {
                    let message = 'Prosedür tamamlanırken hata oluştu.';
                    if (err.response?.data) {
                        const data = err.response.data;
                        if (data.error && data.error.message) {
                            message = data.error.message;
                        } else if (Array.isArray(data) && data.length > 0) {
                            message = data[0];
                        } else if (data.detail) {
                            message = data.detail;
                        } else if (data.non_field_errors && data.non_field_errors.length > 0) {
                            message = data.non_field_errors[0];
                        } else if (typeof data === 'string') {
                            message = data;
                        }
                    }
                    Alert.alert('Hata', message);
                })
                .finally(() => setSubmitting(false));
        };

        if (uncompletedSteps > 0) {
            Alert.alert(
                'Tamamlanamaz',
                `Henüz tamamlanmamış ${uncompletedSteps} adım bulunuyor. Lütfen tüm adımları tamamlayın.`,
                [{ text: 'Tamam', style: 'default' }]
            );
            return; // Block execution
        } else {
            performCompletion();
        }
    };

    // Helper to find next active step index
    // We could use this to auto-scroll, but simple list is fine.

    const [startingNext, setStartingNext] = useState(false);
    const [generatingReport, setGeneratingReport] = useState(false);

    // Calculate overdue status if completed
    let isOverdue = false;
    let daysOverdue = 0;

    if (log && log.status === 'COMPLETED' && log.next_procedure_date) {
        const nextDate = new Date(log.next_procedure_date);
        const today = new Date();
        // Reset hours for accurate date comparison
        nextDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        const diffTime = today.getTime() - nextDate.getTime();
        daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        isOverdue = daysOverdue > 0;
    }

    // Check for duplicate procedures (Smart Banner Logic - Frontend Side)
    const [checkingDuplicate, setCheckingDuplicate] = useState(false);
    const [duplicateLog, setDuplicateLog] = useState<ProcedureLog | null>(null);

    // Check for duplicate procedures (Smart Banner Logic - Frontend Side)
    // Refetch on focus to ensure status is up to date when returning from the new procedure
    useFocusEffect(
        React.useCallback(() => {
            let isActive = true;

            const checkDuplicate = async () => {
                if (!isOverdue || !log) return;

                try {
                    // Don't set loading state if we already have data to avoid flicker, 
                    // unless we want to ensure freshness visually. 
                    // Let's just update silently.
                    if (!duplicateLog) setCheckingDuplicate(true);

                    const res = await procedureService.checkNewerLog(log.id);

                    if (isActive) {
                        if (res.has_newer && res.newer_id) {
                            setDuplicateLog({ id: res.newer_id, status: res.status } as any);
                        } else {
                            // If for some reason it's gone (cancelled?), reset
                            setDuplicateLog(null);
                        }
                    }
                } catch (err) {
                    console.log('Duplicate check failed', err);
                } finally {
                    if (isActive) setCheckingDuplicate(false);
                }
            };

            checkDuplicate();

            return () => {
                isActive = false;
            };
        }, [isOverdue, log])
    );

    const handleGenerateReport = async () => {
        if (!log) return;
        try {
            setGeneratingReport(true);
            const res = await reportEndpoints.generateProcedureReport(log.id);
            const reportData = res.data?.data;
            Alert.alert(
                'Rapor Oluşturuluyor',
                'Rapor hazırlandığında bildirim alacaksınız.',
                [
                    { text: 'Tamam', style: 'default' },
                    {
                        text: 'Rapora Git',
                        onPress: () => router.push(`/(main)/(reports)/${reportData.id}` as any),
                    },
                ]
            );
        } catch (error: any) {
            const message = error.response?.data?.detail || error.message || 'Rapor oluşturulamadı.';
            Alert.alert('Hata', message);
        } finally {
            setGeneratingReport(false);
        }
    };

    const handleStartNextProcedure = async () => {
        if (!log) return;

        try {
            setStartingNext(true);
            // Fix: log.procedure might be an object due to serializer, utilize procedure_id if available
            const procId = log.procedure;
            const entId = log.entity;

            // Ensure we are passing numbers (IDs) not objects
            const pId = typeof procId === 'object' ? (procId as any).id : procId;
            const eId = typeof entId === 'object' ? (entId as any).id : entId;

            const res = await procedureService.startProcedure(pId, eId!);
            const newLog = (res as any).data || res;

            // Replace current screen with new log
            router.replace({
                pathname: "/(main)/execution/[id]",
                params: { id: newLog.id }
            });
        } catch (error: any) {
            Alert.alert('Hata', error.message || 'Yeni prosedür başlatılamadı.');
        } finally {
            setStartingNext(false);
        }
    };

    if (loading) {
        return (
            <Screen center style={{ backgroundColor: theme.backgroundSecondary }}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={{ marginTop: 12 }} color={theme.textSecondary}>Prosedür yükleniyor...</Text>
            </Screen>
        );
    }

    if (!log) return null;

    // Type casting because types might be slightly out of sync or nesting
    const steps = log.step_logs || [];
    const startDate = log.started_at ? new Date(log.started_at).toLocaleDateString('tr-TR', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : '-';

    // Hide banner if newer log is already completed (Case insensitive check)
    const showOverdueBanner = isOverdue && duplicateLog?.status?.toLowerCase() !== 'completed';

    return (
        <Screen safeArea={false} padding={false} style={{ backgroundColor: theme.backgroundSecondary }}>
            <Stack.Screen options={{ title: log.procedure_title || (paramsTitle as string) || 'Prosedür' }} />

            <ScrollView contentContainerStyle={styles.content}>
                {/* Overdue Banner */}
                {showOverdueBanner && (
                    <Card style={[styles.headerCard, { backgroundColor: '#FEE2E2', borderColor: '#EF4444', borderWidth: 1 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <Ionicons name="warning" size={24} color="#DC2626" style={{ marginRight: 8 }} />
                            <Text variant="h3" color="#DC2626">Yeni Prosedür Gecikti</Text>
                        </View>
                        <Text style={{ marginBottom: 16 }} color="#B91C1C">
                            Bir sonraki periyodik kontrol {daysOverdue} gün gecikmiş durumda.
                        </Text>

                        {duplicateLog ? (
                            <Button
                                title="Yeni Süreç Başlatıldı"
                                onPress={() => {
                                    router.push({
                                        pathname: "/(main)/execution/[id]",
                                        params: { id: String(duplicateLog.id) }
                                    });
                                }}
                                style={{ backgroundColor: '#2563EB' }}
                            />
                        ) : (
                            <Button
                                title="Yeni Prosedürü Başlat"
                                onPress={handleStartNextProcedure}
                                loading={startingNext || checkingDuplicate}
                                style={{ backgroundColor: '#DC2626' }}
                            />
                        )}
                    </Card>
                )}

                <Card style={styles.headerCard}>
                    <View style={styles.headerTop}>
                        <View style={[styles.headerIcon, { backgroundColor: theme.primaryLight }]}>
                            <MaterialIcons name="assignment" size={32} color={theme.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text variant="h3">{log.procedure_title}</Text>
                            <Text variant="caption" color={theme.textSecondary}>
                                {log.organization_name} • {log.entity_name}
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: theme.border }]} />

                    <View style={styles.metaContainer}>
                        <View style={styles.metaItem}>
                            <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} />
                            <Text variant="caption" color={theme.textSecondary} style={{ marginLeft: 6 }}>
                                Başlangıç: <Text weight="600" color={theme.text}>{startDate}</Text>
                            </Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Ionicons name="person-outline" size={16} color={theme.textSecondary} />
                            <Text variant="caption" color={theme.textSecondary}>
                                Yürüten: <Text weight="600" color={theme.text}>{log.assigned_to_name || 'Ben'}</Text>
                            </Text>
                        </View>
                    </View>
                </Card>

                <View style={styles.stepsContainer}>
                    <Text variant="h3" style={styles.sectionTitle}>Adımlar</Text>

                    {steps.map((step: StepLog, index: number) => {
                        const isFirstUncompleted = !step.is_completed && steps.slice(0, index).every((s: StepLog) => s.is_completed);
                        const isFocused = !!focusStepId && String(step.id) === String(focusStepId);

                        return (
                            <StepCard
                                key={step.id}
                                step={step}
                                stepNumber={step.step_order || index + 1}
                                isActive={isFirstUncompleted || isFocused}
                                procedureLogId={log.id}
                                onStepCompleted={handleStepComplete}
                            />
                        );
                    })}
                </View>

                <View style={{ height: 80 }} />
            </ScrollView>

            {log.status !== 'COMPLETED' && (
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={100}
                >
                    <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
                        <Button
                            title={submitting ? "Tamamlanıyor..." : "Prosedürü Tamamla"}
                            variant="primary"
                            fullWidth
                            onPress={handleFinishProcedure}
                            disabled={submitting}
                        />
                    </View>
                </KeyboardAvoidingView>
            )}

            {log.status === 'COMPLETED' && canGenerateReport && (
                <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
                    <Button
                        title={generatingReport ? "Oluşturuluyor..." : "Rapor Oluştur ve Paylaş"}
                        variant="primary"
                        fullWidth
                        onPress={handleGenerateReport}
                        disabled={generatingReport}
                        loading={generatingReport}
                    />
                </View>
            )}
        </Screen>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: Spacing.md,
    },
    headerCard: {
        marginBottom: Spacing.lg,
        padding: Spacing.md,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    divider: {
        height: 1,
        marginVertical: Spacing.md,
    },
    metaContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stepsContainer: {
        gap: Spacing.sm,
    },
    sectionTitle: {
        marginBottom: Spacing.sm,
        marginLeft: 4,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: Spacing.lg,
        paddingBottom: 34, // Safe Area fallback
        borderTopWidth: 1,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    }
});
