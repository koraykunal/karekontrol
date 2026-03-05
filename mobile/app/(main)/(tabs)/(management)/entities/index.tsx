import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl, Alert } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/src/components/common/Screen';
import { Text } from '@/src/components/common/Text';
import { Card } from '@/src/components/common/Card';
import { Colors, Spacing } from '@/src/constants/theme';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { usePermissions } from '@/src/features/management';
import { useEntities } from '@/src/features/entities/hooks/queries';
import { Entity } from '@/src/api/types/entity.types';

export default function EntityListScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const { canManage, canEditEntities, canCreateEntities, getScope, user } = usePermissions();

    const [searchQuery, setSearchQuery] = useState('');

    // Fetch entities - filter by department unless user has organization/all scope
    const viewScope = getScope('view_entities');
    const canViewAll = viewScope === 'ORGANIZATION' || viewScope === 'ALL';
    const filters = (user?.is_admin || canViewAll) ? {} : { department: user?.department ?? undefined };
    const { data, isLoading, refetch } = useEntities(filters);
    const entities = (data as any)?.data || data || [];

    // Filter by search query
    const filteredEntities = entities.filter((entity: Entity) =>
        entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entity.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Redirect if no permissions
    if (!canManage) {
        return <Redirect href="/(main)/(tabs)/(dashboard)" />;
    }

    const handleEntityPress = (entity: Entity) => {
        if (canEditEntities) {
            router.push({
                pathname: '/(main)/(tabs)/(management)/entities/[id]',
                params: { id: entity.id }
            });
        }
    };

    const handleCreate = () => {
        Alert.alert('Bilgi', 'Varlık oluşturma ekranı yakında eklenecektir. Şimdilik web panelini kullanabilirsiniz.');
    };

    const renderEntity = useCallback(({ item }: { item: Entity }) => {
        const isEditable = canEditEntities;

        return (
            <TouchableOpacity
                onPress={() => handleEntityPress(item)}
                activeOpacity={0.8}
                disabled={!isEditable}
            >
                <Card style={[styles.entityCard, !isEditable && styles.disabledCard]}>
                    <View style={styles.entityInfo}>
                        <View style={[styles.entityIcon, { backgroundColor: theme.primaryLight }]}>
                            <Ionicons name="cube-outline" size={24} color={theme.primary} />
                        </View>
                        <View style={styles.entityDetails}>
                            <Text variant="body" weight="600">{item.name}</Text>
                            <Text variant="caption" color={theme.textSecondary}>
                                {item.code} • {item.department_name}
                            </Text>
                        </View>
                    </View>
                    {isEditable && (
                        <Ionicons name="create-outline" size={20} color={theme.textMuted} />
                    )}
                </Card>
            </TouchableOpacity>
        );
    }, [canEditEntities, theme]);

    return (
        <Screen padding={false} safeArea={false} style={{ backgroundColor: theme.backgroundSecondary }}>
            {/* Search Bar */}
            <View style={[styles.searchContainer, { backgroundColor: theme.background }]}>
                <View style={[styles.searchInput, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
                    <Ionicons name="search" size={18} color={theme.textMuted} />
                    <TextInput
                        style={[styles.searchText, { color: theme.text }]}
                        placeholder="Varlık ara..."
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
            </View>

            {/* Entity List */}
            <FlatList
                data={filteredEntities}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderEntity}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={refetch} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="cube-outline" size={48} color={theme.textMuted} />
                        <Text variant="body" color={theme.textMuted} style={{ marginTop: 12 }}>
                            {searchQuery ? 'Sonuç bulunamadı' : 'Varlık bulunamadı'}
                        </Text>
                    </View>
                }
            />

            {/* Floating Action Button */}
            {canCreateEntities && (
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: theme.primary, shadowColor: '#000' }]}
                    onPress={handleCreate}
                    activeOpacity={0.9}
                >
                    <Ionicons name="add" size={30} color="#fff" />
                </TouchableOpacity>
            )}
        </Screen>
    );
}

const styles = StyleSheet.create({
    searchContainer: {
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
        zIndex: 1,
    },
    searchInput: {
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
    listContent: {
        padding: Spacing.md,
        paddingBottom: 80, // Extra padding for FAB
    },
    entityCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
        marginBottom: Spacing.sm,
    },
    disabledCard: {
        opacity: 0.8, // Slightly reduced opacity
    },
    entityInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    entityIcon: {
        width: 44,
        height: 44,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    entityDetails: {
        flex: 1,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: Spacing.xxxl,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
    },
});
