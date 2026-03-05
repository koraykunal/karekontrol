import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/src/components/common/Text';
import { Colors, Spacing } from '@/src/constants/theme';
import { Entity } from '@/src/api/types/entity.types';
import { NonComplianceIssue } from '@/src/api/types/issue.types';
import { IssueStatus } from '@/src/api/types/enums';
import { entityService } from '@/src/api/services/entity.service';
import { issueService } from '@/src/api/services/issue.service';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { useAuthStore } from '@/src/store/zustand/auth.store';
import { EntityCard, EntityQuickMenu } from "@/src/features/entities";

export function DashboardEntityList() {
    const router = useRouter();
    const [entities, setEntities] = useState<Entity[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
    const [selectedEntityIssues, setSelectedEntityIssues] = useState<NonComplianceIssue[]>([]);
    const [menuVisible, setMenuVisible] = useState(false);
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const user = useAuthStore(state => state.user);

    const loadEntities = useCallback(async () => {
        setLoading(true);
        try {
            const response = await entityService.getEntities(undefined, { user });
            setEntities((response as any).data || []);
        } catch (error) {
            console.error('Failed to load entities:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadEntities();
    }, [loadEntities]);

    const handleEntityPress = useCallback((id: number) => {
        router.push(`/(main)/(entities)/${id}`);
    }, [router]);

    const handleEntityLongPress = useCallback(async (entity: Entity) => {
        setSelectedEntity(entity);
        setMenuVisible(true);

        // Fetch issues for this entity
        try {
            const response = await issueService.getIssues({ entity: entity.id });
            const allIssues = (response as any)?.data || [];
            // Filter only open/in_progress issues
            const openIssues = allIssues.filter((issue: NonComplianceIssue) =>
                issue.status === IssueStatus.OPEN || issue.status === IssueStatus.IN_PROGRESS
            );
            setSelectedEntityIssues(openIssues);
        } catch (error) {
            console.error('Failed to load entity issues:', error);
            setSelectedEntityIssues([]);
        }
    }, []);

    const handleCloseMenu = useCallback(() => {
        setMenuVisible(false);
        setSelectedEntity(null);
        setSelectedEntityIssues([]);
    }, []);

    const handleViewDetails = useCallback(() => {
        if (selectedEntity) {
            router.push(`/(main)/(entities)/${selectedEntity.id}`);
        }
    }, [router, selectedEntity]);

    const handleStartProcedure = useCallback(() => {
        if (selectedEntity) {
            router.push(`/(main)/(entities)/${selectedEntity.id}`);
        }
    }, [router, selectedEntity]);

    const handleIssuePress = useCallback((issue: NonComplianceIssue) => {
        router.push(`/(main)/execution/issues/${issue.id}`);
    }, [router]);

    const renderItem = useCallback(({ item }: { item: Entity }) => (
        <EntityCard
            entity={item}
            onPress={() => handleEntityPress(item.id)}
            onLongPress={() => handleEntityLongPress(item)}
        />
    ), [handleEntityPress, handleEntityLongPress]);

    const keyExtractor = useCallback((item: Entity) => item.id.toString(), []);

    const renderEmpty = useCallback(() => (
        !loading ? (
            <View style={styles.empty}>
                <Text color={theme.textMuted}>Kayıtlı varlık bulunamadı.</Text>
            </View>
        ) : null
    ), [loading, theme.textMuted]);

    return (
        <View style={styles.container}>
            <FlatList
                data={entities}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshing={loading}
                onRefresh={loadEntities}
                ListEmptyComponent={renderEmpty}
                initialNumToRender={10}
                maxToRenderPerBatch={5}
                windowSize={10}
                removeClippedSubviews={true}
            />

            <EntityQuickMenu
                entity={selectedEntity}
                issues={selectedEntityIssues}
                visible={menuVisible}
                onClose={handleCloseMenu}
                onViewDetails={handleViewDetails}
                onStartProcedure={handleStartProcedure}
                onIssuePress={handleIssuePress}
            />
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: Spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.md,
    },
    refreshButton: {
        padding: 4,
    },
    listContent: {
        paddingBottom: Spacing.xxxl,
    },
    empty: {
        padding: Spacing.xl,
        alignItems: 'center',
    }
});
