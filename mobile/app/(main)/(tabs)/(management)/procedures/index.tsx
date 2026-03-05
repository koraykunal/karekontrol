import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/src/components/common/Screen';
import { Text } from '@/src/components/common/Text';
import { Button } from '@/src/components/common/Button';
import { Card } from '@/src/components/common/Card';
import { Colors, Spacing } from '@/src/constants/theme';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { usePermissions } from '@/src/features/management';
import { useProcedures } from '@/src/features/procedures/hooks/queries';
import { useEntities } from '@/src/features/entities/hooks/queries';
import { Procedure } from '@/src/api/types/procedure.types';
import { Entity } from '@/src/api/types/entity.types';

const priorityColors: Record<string, string> = {
    low: '#10B981',
    medium: '#F59E0B',
    high: '#EF4444',
    critical: '#DC2626',
};

interface EntityWithProcedures {
    entity: Entity;
    procedures: Procedure[];
}

export default function ProcedureListScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const { canManage, user, isAdmin } = usePermissions();

    const [searchQuery, setSearchQuery] = useState('');
    const [expandedEntities, setExpandedEntities] = useState<Set<number>>(new Set());

    // Fetch data
    const entityFilters = isAdmin ? {} : { department: user?.department ?? undefined };

    const { data: entitiesData, isLoading: entitiesLoading, refetch: refetchEntities } = useEntities(entityFilters);
    const { data: proceduresData, isLoading: proceduresLoading, refetch: refetchProcedures } = useProcedures({});

    const entities: Entity[] = (entitiesData as any)?.data || (entitiesData as any)?.results || entitiesData || [];
    const procedures: Procedure[] = (proceduresData as any)?.data || (proceduresData as any)?.results || proceduresData || [];

    const isLoading = entitiesLoading || proceduresLoading;

    // Group procedures by entity
    const groupedData = useMemo(() => {
        // Filter procedures by search
        const filteredProcedures = procedures.filter((proc: Procedure) =>
            proc.title.toLowerCase().includes(searchQuery.toLowerCase())
        );

        // Create a map of entity_id -> procedures (using proc.entity field)
        const entityProcedureMap = new Map<number, Procedure[]>();

        filteredProcedures.forEach((proc: Procedure) => {
            const entityId = proc.entity;
            if (entityId) {
                if (!entityProcedureMap.has(entityId)) {
                    entityProcedureMap.set(entityId, []);
                }
                entityProcedureMap.get(entityId)!.push(proc);
            }
        });

        // Filter entities that have procedures or match search
        const result: EntityWithProcedures[] = entities
            .filter(entity => {
                const hasMatchingProcedures = entityProcedureMap.has(entity.id);
                const entityMatches = entity.name.toLowerCase().includes(searchQuery.toLowerCase());
                return hasMatchingProcedures || (searchQuery === '' && entityMatches);
            })
            .map(entity => ({
                entity,
                procedures: entityProcedureMap.get(entity.id) || [],
            }))
            .sort((a, b) => b.procedures.length - a.procedures.length); // Sort by procedure count

        return result;
    }, [entities, procedures, searchQuery]);

    if (!canManage) {
        return <Redirect href="/(main)/(tabs)/(dashboard)" />;
    }

    const toggleEntity = (entityId: number) => {
        setExpandedEntities(prev => {
            const next = new Set(prev);
            if (next.has(entityId)) {
                next.delete(entityId);
            } else {
                next.add(entityId);
            }
            return next;
        });
    };

    const expandAll = () => {
        setExpandedEntities(new Set(entities.map(e => e.id)));
    };

    const collapseAll = () => {
        setExpandedEntities(new Set());
    };

    const handleProcedurePress = (proc: Procedure) => {
        router.push({
            pathname: '/(main)/(tabs)/(management)/procedures/[id]',
            params: { id: proc.id }
        });
    };

    const handleCreatePress = (entityId?: number) => {
        if (entityId) {
            router.push({
                pathname: '/(main)/(tabs)/(management)/procedures/create',
                params: { entityId }
            });
        } else {
            router.push('/(main)/(tabs)/(management)/procedures/create');
        }
    };

    const handleRefresh = () => {
        refetchEntities();
        refetchProcedures();
    };

    const renderProcedure = (proc: Procedure) => {
        const priorityColor = priorityColors[proc.priority] || theme.textMuted;

        return (
            <TouchableOpacity
                key={proc.id}
                onPress={() => handleProcedurePress(proc)}
                activeOpacity={0.8}
            >
                <View style={[styles.procedureItem, { borderLeftColor: priorityColor, backgroundColor: theme.background }]}>
                    <View style={styles.procedureInfo}>
                        <Text variant="body" weight="500">{proc.title}</Text>
                        <View style={styles.procedureMeta}>
                            <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '20' }]}>
                                <Text variant="caption" color={priorityColor} weight="500">
                                    {proc.priority.toUpperCase()}
                                </Text>
                            </View>
                            {proc.requires_approval && (
                                <View style={[styles.approvalBadge, { backgroundColor: theme.warning + '20' }]}>
                                    <Ionicons name="shield-checkmark" size={12} color={theme.warning} />
                                    <Text variant="caption" color={theme.warning}>Onay</Text>
                                </View>
                            )}
                            {proc.is_active === false && (
                                <View style={[styles.inactiveBadge, { backgroundColor: theme.textMuted + '20' }]}>
                                    <Text variant="caption" color={theme.textMuted}>Pasif</Text>
                                </View>
                            )}
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                </View>
            </TouchableOpacity>
        );
    };

    const renderEntityGroup = ({ item }: { item: EntityWithProcedures }) => {
        const isExpanded = expandedEntities.has(item.entity.id);
        const procedureCount = item.procedures.length;

        return (
            <Card style={styles.entityCard}>
                <TouchableOpacity
                    style={styles.entityHeader}
                    onPress={() => toggleEntity(item.entity.id)}
                    activeOpacity={0.7}
                >
                    <View style={[styles.entityIcon, { backgroundColor: theme.primaryLight }]}>
                        <Ionicons name="cube-outline" size={20} color={theme.primary} />
                    </View>
                    <View style={styles.entityInfo}>
                        <Text variant="body" weight="600">{item.entity.name}</Text>
                        <Text variant="caption" color={theme.textSecondary}>
                            {item.entity.code} • {item.entity.department_name}
                        </Text>
                    </View>
                    <View style={styles.entityRight}>
                        <TouchableOpacity
                            style={[styles.addButton, { backgroundColor: theme.primary + '20' }]}
                            onPress={() => handleCreatePress(item.entity.id)}
                        >
                            <Ionicons name="add" size={18} color={theme.primary} />
                        </TouchableOpacity>
                        <View style={[styles.countBadge, { backgroundColor: procedureCount > 0 ? theme.primary + '20' : theme.textMuted + '20' }]}>
                            <Text variant="caption" weight="600" color={procedureCount > 0 ? theme.primary : theme.textMuted}>
                                {procedureCount}
                            </Text>
                        </View>
                        <Ionicons
                            name={isExpanded ? "chevron-up" : "chevron-down"}
                            size={20}
                            color={theme.textMuted}
                        />
                    </View>
                </TouchableOpacity>

                {isExpanded && (
                    <View style={[styles.proceduresContainer, { borderTopColor: theme.border }]}>
                        {item.procedures.length > 0 ? (
                            item.procedures.map(renderProcedure)
                        ) : (
                            <View style={styles.emptyProcedures}>
                                <Text variant="caption" color={theme.textMuted}>
                                    Bu varlık için prosedür bulunmuyor
                                </Text>
                                <Button
                                    title="Prosedür Ekle"
                                    variant="outline"
                                    size="sm"
                                    onPress={() => handleCreatePress(item.entity.id)}
                                    style={{ marginTop: Spacing.sm }}
                                />
                            </View>
                        )}
                    </View>
                )}
            </Card>
        );
    };

    const allExpanded = expandedEntities.size === entities.length && entities.length > 0;

    return (
        <Screen padding={false} safeArea={false} style={{ backgroundColor: theme.backgroundSecondary }}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.background }]}>
                <View style={[styles.searchInput, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
                    <Ionicons name="search" size={18} color={theme.textMuted} />
                    <TextInput
                        style={[styles.searchText, { color: theme.text }]}
                        placeholder="Prosedür veya varlık ara..."
                        placeholderTextColor={theme.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color={theme.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity
                    style={[styles.createButton, { backgroundColor: theme.primary }]}
                    onPress={() => handleCreatePress()}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Stats Bar */}
            <View style={[styles.stats, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
                <Text variant="caption" color={theme.textSecondary}>
                    {groupedData.length} varlık • {procedures.length} prosedür
                </Text>
                <TouchableOpacity onPress={allExpanded ? collapseAll : expandAll}>
                    <Text variant="caption" color={theme.primary} weight="500">
                        {allExpanded ? 'Tümünü Kapat' : 'Tümünü Aç'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Grouped List */}
            <FlatList
                data={groupedData}
                keyExtractor={(item) => item.entity.id.toString()}
                renderItem={renderEntityGroup}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="clipboard-outline" size={48} color={theme.textMuted} />
                        <Text variant="body" color={theme.textMuted} style={{ marginTop: 12 }}>
                            {searchQuery ? 'Sonuç bulunamadı' : 'Varlık veya prosedür bulunamadı'}
                        </Text>
                        <Button
                            title="Yeni Prosedür Oluştur"
                            variant="primary"
                            onPress={() => handleCreatePress()}
                            style={{ marginTop: 16 }}
                        />
                    </View>
                }
            />
        </Screen>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        gap: Spacing.sm,
    },
    searchInput: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        height: 44,
        borderRadius: 10,
        borderWidth: 1,
        gap: Spacing.sm,
    },
    searchText: {
        flex: 1,
        fontSize: 16,
    },
    createButton: {
        width: 44,
        height: 44,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
    },
    listContent: {
        padding: Spacing.md,
        paddingBottom: 40,
    },
    entityCard: {
        marginBottom: Spacing.sm,
        padding: 0,
        overflow: 'hidden',
    },
    entityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
    },
    entityIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.sm,
    },
    entityInfo: {
        flex: 1,
    },
    entityRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    countBadge: {
        minWidth: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    addButton: {
        width: 28,
        height: 28,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    proceduresContainer: {
        borderTopWidth: 1,
        padding: Spacing.sm,
    },
    procedureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
        borderLeftWidth: 3,
        borderRadius: 8,
        marginBottom: Spacing.xs,
    },
    procedureInfo: {
        flex: 1,
    },
    procedureMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginTop: 4,
    },
    priorityBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    approvalBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        gap: 2,
    },
    inactiveBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    emptyProcedures: {
        alignItems: 'center',
        paddingVertical: Spacing.md,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: Spacing.xxxl,
    },
});
