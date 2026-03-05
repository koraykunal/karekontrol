import React, { useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

import { Text } from '@/src/components/common/Text';
import { Card } from '@/src/components/common/Card';
import { Colors, Spacing, BorderRadius } from '@/src/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEntityHistory } from '@/src/hooks/useEntityHistory';
import type { TimelineEvent, TimelineEventType } from '@/src/api/types/timeline.types';

interface EntityHistoryTimelineProps {
    entityId: number;
}

const eventTypeLabels: Record<TimelineEventType, string> = {
    procedure_completed: 'Tamamlandı',
    procedure_started: 'Başlatıldı',
    issue_reported: 'Bildirildi',
    issue_resolved: 'Çözüldü',
    step_skipped: 'Kontrol Dışı',
    audit_log: 'Denetim',
};

export function EntityHistoryTimeline({ entityId }: EntityHistoryTimelineProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const router = useRouter();
    const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);

    const {
        data: historyResponse,
        isLoading,
        isRefetching,
        error,
        refetch,
    } = useEntityHistory(
        entityId,
        selectedEventTypes.length > 0 ? { event_types: selectedEventTypes.join(',') } : undefined
    );

    const handleTimelineItemPress = useCallback((event: TimelineEvent) => {
        const procedureLogId = event.metadata?.procedure_log_id;

        if (event.event_type === 'procedure_started' || event.event_type === 'procedure_completed') {
            if (procedureLogId) {
                router.push({
                    pathname: '/(main)/execution/[id]',
                    params: { id: procedureLogId, mode: 'execute' }
                });
            }
        }

        // For issue_reported OR issue_resolved, navigate to issue detail page
        if (event.event_type === 'issue_reported' || event.event_type === 'issue_resolved') {
            if (event.metadata?.issue_id) {
                router.push({
                    pathname: '/(main)/execution/issues/[id]',
                    params: { id: event.metadata.issue_id }
                });
            } else if (procedureLogId) {
                // Fallback
                router.push({
                    pathname: '/(main)/execution/[id]',
                    params: {
                        id: procedureLogId,
                        mode: 'execute',
                        focusStepId: event.metadata?.step_log_id || ''
                    }
                });
            }
        }

        // For step_skipped (Kontrol Dışı), navigate to procedure detail and focus on step
        if (event.event_type === 'step_skipped') {
            if (procedureLogId) {
                router.push({
                    pathname: '/(main)/execution/[id]',
                    params: {
                        id: procedureLogId,
                        mode: 'execute',
                        focusStepId: event.metadata?.step_log_id || ''
                    }
                });
            }
        }
    }, [router]);

    const getEventIcon = (eventType: TimelineEventType): keyof typeof Ionicons.glyphMap => {
        switch (eventType) {
            case 'procedure_completed':
                return 'checkmark-circle';
            case 'procedure_started':
                return 'play-circle';
            case 'issue_reported':
                return 'alert-circle';
            case 'issue_resolved':
                return 'checkmark-done-circle';
            case 'step_skipped':
                return 'remove-circle';
            case 'audit_log':
                return 'document-text';
            default:
                return 'ellipse';
        }
    };

    const getEventColor = (eventType: TimelineEventType): string => {
        switch (eventType) {
            case 'procedure_completed':
                return theme.success;
            case 'procedure_started':
                return theme.primary;
            case 'issue_reported':
                return theme.error;
            case 'issue_resolved':
                return theme.success;
            case 'step_skipped':
                return theme.warning;
            case 'audit_log':
                return theme.textSecondary;
            default:
                return theme.border;
        }
    };

    const toggleEventType = (eventType: string) => {
        setSelectedEventTypes((prev) => {
            if (prev.includes(eventType)) {
                return prev.filter((t) => t !== eventType);
            } else {
                return [...prev, eventType];
            }
        });
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), "d MMM yyyy, HH:mm", { locale: tr });
        } catch {
            return dateString;
        }
    };

    const history = historyResponse?.timeline || [];

    const renderTimelineItem = (event: TimelineEvent, index: number, isLast: boolean) => {
        const eventColor = getEventColor(event.event_type);
        const eventIcon = getEventIcon(event.event_type);

        return (
            <View key={`${event.id}-${event.event_type}`} style={styles.timelineItem}>
                {/* Left column - icon and line */}
                <View style={styles.leftColumn}>
                    <View style={[styles.iconContainer, { backgroundColor: eventColor }]}>
                        <Ionicons name={eventIcon} size={16} color="#FFF" />
                    </View>
                    {!isLast && <View style={[styles.line, { backgroundColor: theme.border }]} />}
                </View>

                {/* Content card */}
                <TouchableOpacity
                    style={styles.contentContainer}
                    activeOpacity={0.7}
                    onPress={() => handleTimelineItemPress(event)}
                >
                    <Card style={styles.contentCard}>
                        <View style={styles.headerRow}>
                            <Text weight="600" style={{ flex: 1 }}>{event.title}</Text>
                            <View style={[styles.typeBadge, { backgroundColor: eventColor + '20' }]}>
                                <Text variant="caption" color={eventColor} weight="600" style={{ fontSize: 10 }}>
                                    {eventTypeLabels[event.event_type]}
                                </Text>
                            </View>
                        </View>

                        {event.description && (
                            <Text variant="caption" color={theme.textSecondary} style={{ marginTop: 4 }}>
                                {event.description}
                            </Text>
                        )}

                        <View style={styles.metaRow}>
                            {event.user_name && (
                                <View style={styles.metaItem}>
                                    <Ionicons name="person-outline" size={12} color={theme.textMuted} />
                                    <Text variant="caption" color={theme.textMuted} style={{ marginLeft: 4 }}>
                                        {event.user_name}
                                    </Text>
                                </View>
                            )}
                            <View style={styles.metaItem}>
                                <Ionicons name="time-outline" size={12} color={theme.textMuted} />
                                <Text variant="caption" color={theme.textMuted} style={{ marginLeft: 4 }}>
                                    {formatDate(event.timestamp)}
                                </Text>
                            </View>
                        </View>
                    </Card>
                </TouchableOpacity>
            </View >
        );
    };

    if (error) {
        return (
            <View style={styles.centerContainer}>
                <Ionicons name="alert-circle" size={48} color={theme.error} />
                <Text color={theme.textSecondary} style={{ marginTop: Spacing.md, textAlign: 'center' }}>
                    Geçmiş yüklenirken hata oluştu
                </Text>
                <TouchableOpacity onPress={() => refetch()} style={{ marginTop: Spacing.md }}>
                    <Text color={theme.primary} weight="600">Tekrar Dene</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={{ paddingBottom: Spacing.xl }}
            refreshControl={
                <RefreshControl
                    refreshing={isLoading || isRefetching}
                    onRefresh={() => refetch()}
                    tintColor={theme.primary}
                />
            }
        >
            {/* Filter Chips */}
            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.filterRow}>
                        {(Object.entries(eventTypeLabels) as [TimelineEventType, string][]).map(([eventType, label]) => {
                            const isActive = selectedEventTypes.includes(eventType);
                            return (
                                <TouchableOpacity
                                    key={eventType}
                                    style={[
                                        styles.filterChip,
                                        { borderColor: theme.border, backgroundColor: theme.background },
                                        isActive && { backgroundColor: theme.primary, borderColor: theme.primary },
                                    ]}
                                    onPress={() => toggleEventType(eventType)}
                                >
                                    <Text
                                        variant="caption"
                                        weight="600"
                                        color={isActive ? '#FFF' : theme.textSecondary}
                                    >
                                        {label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </ScrollView>
            </View>

            {/* Timeline Content */}
            {isLoading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text variant="caption" color={theme.textSecondary} style={{ marginTop: Spacing.md }}>
                        Geçmiş yükleniyor...
                    </Text>
                </View>
            ) : history.length > 0 ? (
                <View style={styles.timelineContainer}>
                    {history.map((event, index) =>
                        renderTimelineItem(event, index, index === history.length - 1)
                    )}
                </View>
            ) : (
                <View style={styles.centerContainer}>
                    <Ionicons name="time-outline" size={48} color={theme.textMuted} />
                    <Text color={theme.textSecondary} style={{ marginTop: Spacing.md, textAlign: 'center' }}>
                        {selectedEventTypes.length > 0
                            ? 'Seçili filtrelere uygun kayıt bulunamadı'
                            : 'Henüz geçmiş kaydı bulunmuyor'}
                    </Text>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    filterContainer: {
        paddingVertical: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    filterRow: {
        flexDirection: 'row',
        gap: Spacing.xs,
        paddingHorizontal: Spacing.xs,
    },
    filterChip: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: 16,
        borderWidth: 1,
    },
    timelineContainer: {
        paddingHorizontal: Spacing.xs,
    },
    timelineItem: {
        flexDirection: 'row',
        minHeight: 90,
    },
    leftColumn: {
        alignItems: 'center',
        marginRight: Spacing.md,
        width: 28,
    },
    iconContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    line: {
        width: 2,
        flex: 1,
        marginVertical: 4,
    },
    contentContainer: {
        flex: 1,
        marginBottom: Spacing.md,
    },
    contentCard: {
        padding: Spacing.sm,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: Spacing.sm,
    },
    typeBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
        marginTop: Spacing.sm,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: Spacing.xl * 2,
    },
});
