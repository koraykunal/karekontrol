import React, { useEffect, useState, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname, useSegments, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../common/Text';
import { Colors, Spacing } from '@/src/constants/theme';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { useAuthStore } from '@/src/store/zustand/auth.store';
import { notificationEndpoints } from '@/src/api/endpoints/notification.endpoints';

import { useNotificationContext } from '@/src/providers/NotificationProvider';

interface AppHeaderProps {
    title?: string;
    showBack?: boolean;
}

export function AppHeader({ title, showBack }: AppHeaderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const segments = useSegments();
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const user = useAuthStore(state => state.user);
    const { unreadCount, refreshUnreadCount } = useNotificationContext();

    const segmentStrings = segments as string[];
    const isDetailPage = segmentStrings.some(seg =>
        seg === '(entities)' ||
        seg === '(procedures)' ||
        seg === '(issues)' ||
        seg === '(reports)'
    );

    const canGoBack = showBack !== false && isDetailPage;

    useFocusEffect(
        useCallback(() => {
            refreshUnreadCount();
        }, [refreshUnreadCount])
    );

    // Refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(refreshUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [refreshUnreadCount]);

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(main)/(tabs)/(dashboard)');
        }
    };

    const handleNotifications = () => {
        router.push('/(main)/notifications');
    };

    return (
        <View style={[
            styles.container,
            {
                paddingTop: insets.top + Spacing.sm,
                backgroundColor: theme.background,
                borderBottomColor: theme.border,
            }
        ]}>
            <View style={styles.leftSection}>
                {canGoBack ? (
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color={theme.primary} />
                    </TouchableOpacity>
                ) : (
                    <Text variant="body" weight="600" color={theme.text}>
                        {user?.full_name || 'Merhaba'}
                    </Text>
                )}
            </View>

            {title && (
                <View style={styles.centerSection}>
                    <Text variant="body" weight="600" color={theme.text} numberOfLines={1}>
                        {title}
                    </Text>
                </View>
            )}

            <View style={styles.rightSection}>
                <TouchableOpacity onPress={handleNotifications} style={styles.iconButton}>
                    <Ionicons name="notifications-outline" size={24} color={theme.text} />
                    {unreadCount > 0 && (
                        <View style={[styles.badge, { backgroundColor: theme.error }]}>
                            <Text variant="caption" weight="600" color="#FFF" style={styles.badgeText}>
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.sm,
        borderBottomWidth: 1,
        minHeight: 56,
    },
    leftSection: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    centerSection: {
        flex: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rightSection: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    backButton: {
        marginLeft: -Spacing.sm,
        padding: Spacing.xs,
    },
    iconButton: {
        padding: Spacing.xs,
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: 0,
        right: 0,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        fontSize: 10,
        lineHeight: 12,
    },
});
