import React from 'react';
import { View, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { format, isBefore, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/src/components/common/Text';
import { Card } from '@/src/components/common/Card';
import { Colors, Spacing } from '@/src/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface EntityProceduresProps {
    procedures: any[];
    entityId: number;
    onProcedurePress: (procedure: any) => void;
    startingId?: number | null;
    activeProcedureIds?: Set<number>;
}

export function EntityProcedures({ procedures, entityId, onProcedurePress, startingId, activeProcedureIds = new Set() }: EntityProceduresProps) {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const formatFrequency = (val: number, unit: string) => {
        if (!val || !unit) return '';

        if (val === 1) {
            switch (unit) {
                case 'DAYS': return 'Sıklık: Günlük';
                case 'WEEKS': return 'Sıklık: Haftalık';
                case 'MONTHS': return 'Sıklık: Aylık';
                case 'YEARS': return 'Sıklık: Yıllık';
                default: return `Sıklık: Her ${unit}`;
            }
        } else {
            let unitName = '';
            switch (unit) {
                case 'DAYS': unitName = 'Gün'; break;
                case 'WEEKS': unitName = 'Hafta'; break;
                case 'MONTHS': unitName = 'Ay'; break;
                case 'YEARS': unitName = 'Yıl'; break;
                default: unitName = unit;
            }
            return `Sıklık: Her ${val} ${unitName}da bir`;
        }
    };

    return (
        <View style={styles.section}>
            <Text variant="h3" style={[styles.sectionTitle, { color: theme.text }]}>
                İşlemler
            </Text>
            <Card noPadding>
                {procedures && procedures.length > 0 ? (
                    procedures.map((procedure, index) => {
                        const isOverdue = procedure.next_due_date && isBefore(parseISO(procedure.next_due_date), new Date());
                        const nextDueColor = isOverdue ? theme.error : theme.textSecondary;
                        const isStarting = startingId === procedure.id;
                        const isAlreadyActive = activeProcedureIds.has(procedure.id);
                        const isDisabled = !!startingId || isAlreadyActive;

                        return (
                            <TouchableOpacity
                                key={procedure.id}
                                style={[
                                    styles.procedureItem,
                                    { borderBottomColor: theme.border },
                                    index === procedures.length - 1 && { borderBottomWidth: 0 },
                                    isAlreadyActive && {
                                        backgroundColor: theme.warning + '15',
                                        borderLeftWidth: 3,
                                        borderLeftColor: theme.warning
                                    }
                                ]}
                                onPress={() => onProcedurePress(procedure)}
                                disabled={isDisabled}
                            >
                                {isStarting ? (
                                    <View style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                                        <ActivityIndicator size="small" color={theme.primary} />
                                    </View>
                                ) : isAlreadyActive ? (
                                    <View style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 16,
                                        backgroundColor: theme.warning + '20',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <Ionicons name="sync" size={18} color={theme.warning} />
                                    </View>
                                ) : (
                                    <View style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 16,
                                        backgroundColor: theme.primary + '15',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <Ionicons name="play" size={16} color={theme.primary} />
                                    </View>
                                )}

                                <View style={[styles.procedureInfo, { opacity: isAlreadyActive ? 0.7 : 1 }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                        <Text weight="600" color={isAlreadyActive ? theme.textSecondary : theme.text}>
                                            {procedure.title}
                                        </Text>
                                        {isAlreadyActive && (
                                            <View style={{
                                                backgroundColor: theme.warning,
                                                paddingHorizontal: 8,
                                                paddingVertical: 2,
                                                borderRadius: 10
                                            }}>
                                                <Text variant="caption" color="#fff" weight="600" style={{ fontSize: 10 }}>
                                                    Devam Ediyor
                                                </Text>
                                            </View>
                                        )}
                                        {procedure.open_issue_count > 0 && (
                                            <View style={{
                                                backgroundColor: '#E65100',
                                                paddingHorizontal: 8,
                                                paddingVertical: 2,
                                                borderRadius: 10,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: 4
                                            }}>
                                                <Ionicons name="warning" size={10} color="#fff" />
                                                <Text variant="caption" color="#fff" weight="600" style={{ fontSize: 10 }}>
                                                    {procedure.open_issue_count} Uygunsuzluk
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap', gap: 8 }}>
                                        {procedure.interval_value && (
                                            <View style={styles.metaTag}>
                                                <Ionicons name="repeat" size={10} color={theme.primary} style={{ marginRight: 2 }} />
                                                <Text variant="caption" color={theme.primary} weight="600">
                                                    {formatFrequency(procedure.interval_value, procedure.interval_unit).replace('Sıklık: ', '')}
                                                </Text>
                                            </View>
                                        )}

                                        {/* Dates Row */}
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            {procedure.last_completed_at && (
                                                <Text variant="caption" color={theme.textMuted} style={{ fontSize: 11 }}>
                                                    Son: {format(parseISO(procedure.last_completed_at), 'd MMM', { locale: tr })}
                                                </Text>
                                            )}
                                            {procedure.next_due_date && (
                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                    <Ionicons
                                                        name={isOverdue ? "alert-circle" : "calendar-outline"}
                                                        size={10}
                                                        color={nextDueColor}
                                                        style={{ marginRight: 2 }}
                                                    />
                                                    <Text variant="caption" color={nextDueColor} weight={isOverdue ? "bold" : "normal"} style={{ fontSize: 11 }}>
                                                        Hedef: {format(parseISO(procedure.next_due_date), 'd MMM', { locale: tr })}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                    {(procedure.description) && (
                                        <Text variant="caption" color={theme.textSecondary} numberOfLines={1} style={{ marginTop: 2 }}>
                                            {procedure.description}
                                        </Text>
                                    )}
                                </View>
                                {isAlreadyActive ? (
                                    <Ionicons name="arrow-forward-circle" size={22} color={theme.warning} />
                                ) : (
                                    <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                                )}
                            </TouchableOpacity>
                        );
                    })
                ) : (
                    <View style={{ padding: Spacing.lg, alignItems: 'center' }}>
                        <Text color={theme.textMuted}>Bu departman için prosedür bulunamadı</Text>
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.procedureItem, { borderTopWidth: 1, borderTopColor: theme.border, borderBottomWidth: 0 }]}
                    onPress={() => router.push({ pathname: '/(main)/(issues)/create', params: { entityId: String(entityId) } } as any)}
                    disabled={!!startingId}
                >
                    <Ionicons name="alert-circle" size={28} color={theme.warning} />
                    <View style={styles.procedureInfo}>
                        <Text weight="600" color={theme.text}>Sorun Bildir</Text>
                        <Text variant="caption" color={theme.textSecondary}>
                            Sorun veya uygunsuzluk bildirin
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                </TouchableOpacity>
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        paddingHorizontal: Spacing.md,
        marginTop: Spacing.lg,
    },
    sectionTitle: {
        marginBottom: Spacing.xs,
        marginLeft: 4,
        fontSize: 16,
        fontWeight: '700',
    },
    procedureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderBottomWidth: 1,
    },
    procedureInfo: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    metaTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.light.primary + '10', // Light opacity bg
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    }
});
