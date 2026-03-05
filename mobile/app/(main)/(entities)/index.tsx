import React, { useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { Text } from '@/src/components/common/Text';
import { Colors, Spacing } from '@/src/constants/theme';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { entityService } from '@/src/api/services/entity.service';
import { EntityCard } from '@/src/features/entities';
import { useAuthStore } from '@/src/store/zustand/auth.store';
import { Ionicons } from '@expo/vector-icons';
import type { Entity } from '@/src/api/types/entity.types';

export default function EntitiesListScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const user = useAuthStore(state => state.user);

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['entities'],
        queryFn: () => entityService.getEntities(undefined, { user }),
    });

    const entities: Entity[] = (data as any)?.data || [];

    const handleEntityPress = useCallback((id: number) => {
        router.push(`/(main)/(entities)/${id}`);
    }, [router]);

    const renderItem = useCallback(({ item }: { item: Entity }) => (
        <EntityCard
            entity={item}
            onPress={() => handleEntityPress(item.id)}
        />
    ), [handleEntityPress]);

    return (
        <View style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
            <Stack.Screen options={{
                headerShown: true,
                title: 'Varlıklar',
                headerShadowVisible: false,
                headerStyle: { backgroundColor: theme.backgroundSecondary },
                headerTintColor: theme.text,
                headerTitleStyle: { fontWeight: '600' },
            }} />

            <FlatList
                data={entities}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
                ListEmptyComponent={
                    !isLoading ? (
                        <View style={styles.empty}>
                            <Ionicons name="cube-outline" size={48} color={theme.textMuted} />
                            <Text color={theme.textMuted} style={styles.emptyText}>
                                Varlık bulunamadı
                            </Text>
                        </View>
                    ) : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    listContent: {
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.xxxl,
    },
    empty: {
        alignItems: 'center',
        paddingTop: Spacing.xxxl,
        gap: Spacing.sm,
    },
    emptyText: { marginTop: Spacing.xs },
});
