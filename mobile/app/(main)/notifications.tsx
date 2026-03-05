import React, { useCallback, useMemo, useState } from 'react';
import {
    View,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRouter, Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/src/components/common/Text';
import { Colors, Spacing } from '@/src/constants/theme';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { notificationEndpoints } from '@/src/api/endpoints/notification.endpoints';
import type { Notification } from '@/src/api/types/notification.types';

import { useNotificationContext } from '@/src/providers/NotificationProvider';

export default function NotificationsScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const { lastNotification } = useNotificationContext();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = useCallback(async () => {
        try {
            const response = await notificationEndpoints.getNotifications();
            const items = (response.data as any)?.data || [];
            const list = Array.isArray(items) ? items : [];
            list.sort((a: Notification, b: Notification) => {
                if (a.is_persistent && !b.is_persistent) return -1;
                if (!a.is_persistent && b.is_persistent) return 1;
                return 0;
            });
            setNotifications(list);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            setNotifications([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Reload when new notification arrives
    React.useEffect(() => {
        if (lastNotification) {
            fetchNotifications();
        }
    }, [lastNotification, fetchNotifications]);

    useFocusEffect(
        useCallback(() => {
            fetchNotifications();
        }, [fetchNotifications])
    );

    const handleRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const handleNotificationPress = async (notification: Notification) => {
        if (!notification.is_read) {
            try {
                await notificationEndpoints.markAsRead(notification.id);
                setNotifications(prev =>
                    prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
                );
            } catch (error) {
                console.error('Failed to mark as read:', error);
            }
        }

        const url = notification.action_url;
        if (url) {
            const mobileUrl = url
                .replace(/^\/procedures\/(\d+)/, '/(main)/execution/$1')
                .replace(/^\/issues\/(\d+)/, '/(main)/execution/issues/$1')
                .replace(/^\/reports\/(\d+)\/?/, '/(main)/(reports)/$1');
            router.push(mobileUrl as any);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationEndpoints.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'PROCEDURE_DUE':
            case 'PROCEDURE_OVERDUE':
                return 'assignment-late';
            case 'NON_COMPLIANCE_REPORTED':
            case 'NON_COMPLIANCE_OVERDUE':
                return 'warning';
            case 'NON_COMPLIANCE_RESOLVED':
                return 'check-circle';
            case 'NON_COMPLIANCE_COMMENT':
                return 'comment';
            case 'NON_COMPLIANCE_STATUS_CHANGED':
                return 'swap-horiz';
            case 'NON_COMPLIANCE_ASSIGNED':
                return 'person-add';
            case 'ENTITY_SHARED':
            case 'PROCEDURE_SHARED':
                return 'share';
            case 'ASSIGNMENT_NEW':
            case 'ASSIGNMENT_UPDATED':
                return 'assignment-ind';
            case 'HELP_REQUEST_RECEIVED':
            case 'HELP_REQUEST_RESPONDED':
                return 'help';
            case 'SYSTEM':
                return 'alarm';
            default:
                return 'notifications';
        }
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'PROCEDURE_OVERDUE':
            case 'NON_COMPLIANCE_OVERDUE':
            case 'NON_COMPLIANCE_REPORTED':
            case 'NON_COMPLIANCE_STATUS_CHANGED':
                return theme.error;
            case 'PROCEDURE_DUE':
            case 'NON_COMPLIANCE_ASSIGNED':
            case 'ASSIGNMENT_NEW':
                return theme.warning;
            case 'NON_COMPLIANCE_RESOLVED':
                return theme.success;
            default:
                return theme.primary;
        }
    };

    const formatTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Şimdi';
        if (diffMins < 60) return `${diffMins} dk önce`;
        if (diffHours < 24) return `${diffHours} saat önce`;
        if (diffDays < 7) return `${diffDays} gün önce`;
        return date.toLocaleDateString('tr-TR');
    };

    const styles = useMemo(() => createStyles(theme), [theme]);

    const NotificationItem = useCallback(({ item }: { item: Notification }) => (
        <TouchableOpacity
            style={[
                styles.notificationItem,
                {
                    backgroundColor: item.is_persistent
                        ? theme.error + '08'
                        : item.is_read
                            ? theme.background
                            : theme.primaryLight || theme.backgroundSecondary,
                    borderLeftColor: getNotificationColor(item.type),
                    opacity: item.is_read && !item.is_persistent ? 0.7 : 1,
                }
            ]}
            onPress={() => handleNotificationPress(item)}
            activeOpacity={0.7}
        >
            <View style={[styles.iconContainer, { backgroundColor: getNotificationColor(item.type) + '20' }]}>
                <MaterialIcons
                    name={getNotificationIcon(item.type) as any}
                    size={24}
                    color={getNotificationColor(item.type)}
                />
            </View>
            <View style={styles.contentContainer}>
                <View style={styles.titleRow}>
                    <Text variant="body" weight={item.is_read && !item.is_persistent ? 'normal' : '600'} color={theme.text}
                        style={styles.title}>
                        {item.title}
                    </Text>
                    {item.is_persistent && (
                        <MaterialIcons name="push-pin" size={14} color={theme.error} style={{ marginLeft: 4 }} />
                    )}
                    {!item.is_read && <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />}
                </View>
                <Text variant="caption" color={theme.textSecondary} numberOfLines={2}>
                    {item.message}
                </Text>
                <Text variant="caption" color={theme.textMuted} style={styles.time}>
                    {formatTimeAgo(item.created_at)}
                </Text>
            </View>
        </TouchableOpacity>
    ), [styles, theme, handleNotificationPress, getNotificationColor, getNotificationIcon]);

    const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.is_read).length : 0;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={[]}>
            <Stack.Screen
                options={{
                    title: 'Bildirimler',
                    headerShown: true,
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: theme.background },
                    headerBackButtonDisplayMode: "minimal",
                    headerTintColor: theme.text,
                    headerTitleStyle: { fontWeight: '600' },

                    headerRight: () =>
                        unreadCount > 0 ? (
                            <TouchableOpacity
                                onPress={handleMarkAllRead}
                                style={{ paddingHorizontal: Spacing.sm }}
                            >
                                <Text variant="caption" color={theme.primary} weight="600">
                                    Tümünü Oku
                                </Text>
                            </TouchableOpacity>
                        ) : null,
                }}
            />

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : notifications.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <MaterialIcons name="notifications-none" size={64} color={theme.textMuted} />
                    <Text variant="body" color={theme.textSecondary} style={styles.emptyText}>
                        Henüz bildirim yok
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={({ item }) => <NotificationItem item={item} />}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={[theme.primary]}
                            tintColor={theme.primary}
                        />
                    }
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
            )}
        </SafeAreaView>
    );
}

const createStyles = (theme: typeof Colors.light) =>
    StyleSheet.create({
        container: {
            flex: 1,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        emptyContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: Spacing.xl,
        },
        emptyText: {
            marginTop: Spacing.md,
            textAlign: 'center',
        },
        listContent: {
            paddingVertical: Spacing.sm,
        },
        notificationItem: {
            flexDirection: 'row',
            paddingHorizontal: Spacing.md,
            paddingVertical: Spacing.md,
            borderLeftWidth: 3,
        },
        iconContainer: {
            width: 44,
            height: 44,
            borderRadius: 22,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: Spacing.md,
        },
        contentContainer: {
            flex: 1,
        },
        titleRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 4,
        },
        title: {
            flex: 1,
        },
        unreadDot: {
            width: 8,
            height: 8,
            borderRadius: 4,
            marginLeft: Spacing.sm,
        },
        time: {
            marginTop: 6,
        },
        separator: {
            height: 1,
            backgroundColor: theme.border,
            marginLeft: Spacing.md + 44 + Spacing.md,
        },
    });
