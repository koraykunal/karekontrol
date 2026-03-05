import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';
import { usePushNotifications, NotificationHandlers } from '@/src/hooks/usePushNotifications';
import { useAuthStore } from '@/src/store/zustand/auth.store';

interface NotificationContextType {
    expoPushToken: string | null;
    lastNotification: Notifications.Notification | null;
    unreadCount: number;
    refreshUnreadCount: () => void;
    incrementUnreadCount: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotificationContext() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotificationContext must be used within NotificationProvider');
    }
    return context;
}

interface NotificationProviderProps {
    children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
    const [unreadCount, setUnreadCount] = useState(0);
    const [lastNotification, setLastNotification] = useState<Notifications.Notification | null>(null);
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);

    const refreshUnreadCount = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const { notificationEndpoints } = await import('@/src/api/endpoints/notification.endpoints');
            const response = await notificationEndpoints.getUnreadCount();
            const data = response.data as any;
            setUnreadCount(data?.count || 0);
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    }, [isAuthenticated]);

    const incrementUnreadCount = useCallback(() => {
        setUnreadCount(prev => prev + 1);
    }, []);

    const handlers: NotificationHandlers = {
        onNotificationReceived: (notification) => {
            setLastNotification(notification);
            incrementUnreadCount();
        },
    };

    const { expoPushToken, notification } = usePushNotifications(handlers);

    return (
        <NotificationContext.Provider
            value={{
                expoPushToken,
                lastNotification: lastNotification || notification,
                unreadCount,
                refreshUnreadCount,
                incrementUnreadCount,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}
