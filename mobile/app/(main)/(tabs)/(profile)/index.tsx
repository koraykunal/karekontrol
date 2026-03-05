import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/store/zustand/auth.store';
import { useLogout } from '@/src/store/react-query/hooks/use-auth';
import { ProfileHeader } from '@/src/features/profile/components/ProfileHeader';
import { ProfileInfo } from '@/src/features/profile/components/ProfileInfo';
import { Text } from '@/src/components/common/Text';
import { Colors, Spacing, BorderRadius } from '@/src/constants/theme';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { ENV } from '@/src/constants/env';

export default function ProfileRoute() {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const logoutMutation = useLogout();

    const handleLogout = () => {
        Alert.alert(
            'Çıkış Yap',
            'Uygulamadan çıkış yapmak istediğinize emin misiniz?',
            [
                {
                    text: 'İptal',
                    style: 'cancel',
                },
                {
                    text: 'Çıkış Yap',
                    style: 'destructive',
                    onPress: () => {
                        logoutMutation.mutate();
                    },
                },
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <ProfileHeader
                    fullName={user?.full_name}
                    email={user?.email}
                    role={user?.role}
                />

                <ProfileInfo
                    organizationName={user?.organization_name}
                    phone={user?.phone}
                    departmentName={user?.department_name}
                />

                {__DEV__ && (
                    <View style={[styles.debugSection, { backgroundColor: theme.background, borderColor: theme.border }]}>
                        <Text variant="body" weight="600" style={{ marginBottom: 8 }}>Debug Info</Text>
                        <Text variant="caption" color={theme.textSecondary}>
                            is_manager: {String(user?.is_manager)}{'\n'}
                            is_admin: {String(user?.is_admin)}{'\n'}
                            is_super_admin: {String(user?.is_super_admin)}{'\n'}
                            access_management: {String((user?.permissions?.access_management as any)?.enabled)}
                        </Text>
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.menuItem, { backgroundColor: theme.cardBackground }]}
                    onPress={() => router.push('/(main)/(tabs)/(profile)/notification-settings')}
                >
                    <View style={styles.menuItemLeft}>
                        <Ionicons name="notifications-outline" size={20} color={theme.primary} />
                        <Text weight="500">Bildirim Tercihleri</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.logoutButton, { backgroundColor: theme.error }]}
                    onPress={handleLogout}
                    disabled={logoutMutation.isPending}
                >
                    {logoutMutation.isPending ? (
                        <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                    ) : (
                        <Ionicons name="log-out-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                    )}
                    <Text style={styles.logoutText}>
                        {logoutMutation.isPending ? 'Çıkış yapılıyor...' : 'Çıkış Yap'}
                    </Text>
                </TouchableOpacity>

                <Text style={[styles.version, { color: theme.textMuted }]}>v{ENV.VERSION}</Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: Spacing.sm,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logoutButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginTop: 8,
    },
    logoutText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    version: {
        textAlign: 'center',
        marginTop: 24,
        fontSize: 12,
    },
    debugSection: {
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 16,
    },
});
