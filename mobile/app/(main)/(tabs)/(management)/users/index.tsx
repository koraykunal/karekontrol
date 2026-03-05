import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl, Alert } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/src/components/common/Screen';
import { Text } from '@/src/components/common/Text';
import { Card } from '@/src/components/common/Card';
import { Colors, Spacing } from '@/src/constants/theme';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { usePermissions, useUsers } from '@/src/features/management';
import { User } from '@/src/api/types/auth.types';

const roleLabels: Record<string, string> = {
    SUPER_ADMIN: 'Süper Admin',
    ADMIN: 'Yönetici',
    MANAGER: 'Departman Müdürü',
    WORKER: 'Çalışan',
};

const roleColors: Record<string, string> = {
    SUPER_ADMIN: '#DC2626',
    ADMIN: '#7C3AED',
    MANAGER: '#2563EB',
    WORKER: '#10B981',
};

export default function UserListScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const { canManage, canManageUsers, canCreateUsers, isAdmin, user } = usePermissions();

    const [searchQuery, setSearchQuery] = useState('');

    // Fetch users - filter by department for managers
    const filters = isAdmin ? {} : { department: user?.department ?? undefined };
    const { data, isLoading, refetch } = useUsers(filters);
    const users: User[] = (data as any)?.data || (data as any)?.results || data || [];

    // Filter by search query
    const filteredUsers = users.filter((u: User) =>
        u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!canManage) {
        return <Redirect href="/(main)/(tabs)/(dashboard)" />;
    }

    const handleUserPress = (targetUser: User) => {
        if (canManageUsers) {
            router.push({
                pathname: '/(main)/(tabs)/(management)/users/[id]',
                params: { id: targetUser.id }
            });
        }
    };

    const handleCreate = () => {
        Alert.alert('Bilgi', 'Kullanıcı oluşturma ekranı yakında eklenecektir. Şimdilik web panelini kullanabilirsiniz.');
    };

    const renderUser = useCallback(({ item }: { item: User }) => {
        const roleColor = roleColors[item.role] || theme.textMuted;
        const isEditable = canManageUsers;

        return (
            <TouchableOpacity
                onPress={() => handleUserPress(item)}
                activeOpacity={0.8}
                disabled={!isEditable}
            >
                <Card style={[styles.userCard, !isEditable && { opacity: 0.8 }]}>
                    <View style={styles.userInfo}>
                        <View style={[styles.avatar, { backgroundColor: roleColor + '20' }]}>
                            <Text variant="h3" color={roleColor}>
                                {item.full_name.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <View style={styles.userDetails}>
                            <View style={styles.nameRow}>
                                <Text variant="body" weight="600">{item.full_name}</Text>
                                {!item.is_active && (
                                    <View style={[styles.badge, { backgroundColor: theme.error + '20' }]}>
                                        <Text variant="caption" color={theme.error}>Pasif</Text>
                                    </View>
                                )}
                            </View>
                            <Text variant="caption" color={theme.textSecondary}>{item.email}</Text>
                            <View style={styles.roleRow}>
                                <View style={[styles.roleTag, { backgroundColor: roleColor + '20' }]}>
                                    <Text variant="caption" color={roleColor} weight="500">
                                        {roleLabels[item.role] || item.role}
                                    </Text>
                                </View>
                                {item.department_name && (
                                    <Text variant="caption" color={theme.textMuted}>
                                        {item.department_name}
                                    </Text>
                                )}
                            </View>
                        </View>
                    </View>
                    {isEditable && (
                        <Ionicons name="create-outline" size={20} color={theme.textMuted} />
                    )}
                </Card>
            </TouchableOpacity>
        );
    }, [theme, canManageUsers]);

    return (
        <Screen padding={false} safeArea={false} style={{ backgroundColor: theme.backgroundSecondary }}>
            {/* Search Bar */}
            <View style={[styles.searchContainer, { backgroundColor: theme.background }]}>
                <View style={[styles.searchInput, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
                    <Ionicons name="search" size={18} color={theme.textMuted} />
                    <TextInput
                        style={[styles.searchText, { color: theme.text }]}
                        placeholder="Kullanıcı ara..."
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

            {/* User List */}
            <FlatList
                data={filteredUsers}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderUser}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={refetch} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="people-outline" size={48} color={theme.textMuted} />
                        <Text variant="body" color={theme.textMuted} style={{ marginTop: 12 }}>
                            {searchQuery ? 'Sonuç bulunamadı' : 'Kullanıcı bulunamadı'}
                        </Text>
                    </View>
                }
            />

            {/* Floating Action Button */}
            {canCreateUsers && (
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
        paddingBottom: 40,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
        marginBottom: Spacing.sm,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    userDetails: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    badge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    roleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginTop: 4,
    },
    roleTag: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
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
