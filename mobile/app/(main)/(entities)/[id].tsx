import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useRouter, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/src/components/common/Screen';
import { Text } from '@/src/components/common/Text';
import { ActiveProceduresBar } from '@/src/features/dashboard';
import { EntityHistoryTimeline } from '@/src/features/timeline';
import { EntityInfo } from '@/src/features/entities/components/EntityInfo';
import { EntityProcedures } from '@/src/features/entities/components/EntityProcedures';
import { useEntityDetail } from '@/src/features/entities/hooks/useEntityDetail';
import { procedureService } from '@/src/api/services/procedure.service';
import { Colors, Spacing } from '@/src/constants/theme';
import { useColorScheme } from '@/src/hooks/use-color-scheme';

export default function EntityDetailRoute() {
    const { id } = useLocalSearchParams();
    const entityId = Number(id);

    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');
    const [startingId, setStartingId] = useState<number | null>(null);

    const { entity, procedures, activeProcedures, loading, refetch } = useEntityDetail(entityId, activeTab);

    useFocusEffect(
        React.useCallback(() => {
            if (activeTab === 'overview') {
                refetch();
            }
        }, [activeTab])
    );

    const handleProcedurePress = async (procedure: any) => {
        if (startingId) return; // Prevent double click

        try {
            setStartingId(procedure.id);
            const res = await procedureService.startProcedure(procedure.id, entityId);
            const log = (res as any).data || res;

            router.push({
                pathname: '/(main)/execution/[id]',
                params: { id: log.id, title: log.procedure_title, mode: 'execute' }
            });
        } catch (error: any) {
            console.error('Start procedure failed', error);
            Alert.alert('Hata', error.response?.data?.detail || 'Prosedür başlatılamadı.');
        } finally {
            setStartingId(null);
        }
    };

    const handleActiveProcedurePress = (proc: any) => {
        router.push({
            pathname: '/(main)/execution/[id]',
            params: { id: proc.id, title: proc.procedure_title, mode: 'execute' }
        });
    };

    if (loading) {
        return (
            <Screen center>
                <ActivityIndicator size="large" color={theme.primary} />
            </Screen>
        );
    }

    if (!entity) return null;

    // Compute set of procedure IDs that are currently running
    const activeProcedureIds = new Set(activeProcedures.map((p: any) => p.procedure_id));

    return (
        <Screen safeArea={false} padding={false} style={{ backgroundColor: theme.backgroundSecondary }}>
            <Stack.Screen options={{ title: entity.name }} />

            <View style={[styles.tabContainer, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'overview' && { borderBottomColor: theme.primary }]}
                    onPress={() => setActiveTab('overview')}
                >
                    <Text
                        weight="600"
                        color={activeTab === 'overview' ? theme.primary : theme.textSecondary}
                    >
                        Genel Bakış
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'history' && { borderBottomColor: theme.primary }]}
                    onPress={() => setActiveTab('history')}
                >
                    <Text
                        weight="600"
                        color={activeTab === 'history' ? theme.primary : theme.textSecondary}
                    >
                        Geçmiş
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={{ flex: 1 }}>
                <View style={{ flex: 1, display: activeTab === 'overview' ? 'flex' : 'none' }}>
                    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
                        <ActiveProceduresBar
                            procedures={activeProcedures}
                            onProcedurePress={handleActiveProcedurePress}
                        />
                        <EntityInfo entity={entity} />
                        <EntityProcedures
                            procedures={procedures}
                            entityId={entityId}
                            onProcedurePress={handleProcedurePress}
                            startingId={startingId}
                            activeProcedureIds={activeProcedureIds}
                        />
                    </ScrollView>
                </View>

                <View style={{ flex: 1, display: activeTab === 'history' ? 'flex' : 'none', padding: Spacing.md }}>
                    <EntityHistoryTimeline entityId={entityId} />
                </View>
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.md,
        borderBottomWidth: 1,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    content: {
        paddingBottom: 40,
    },
});
