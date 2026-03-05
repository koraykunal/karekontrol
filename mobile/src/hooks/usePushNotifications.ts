import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';

import { notificationEndpoints } from '@/src/api/endpoints/notification.endpoints';
import { useAuthStore } from '@/src/store/zustand/auth.store';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export interface NotificationHandlers {
    onNotificationReceived?: (notification: Notifications.Notification) => void;
    onNotificationResponse?: (response: Notifications.NotificationResponse) => void;
}

export function usePushNotifications(handlers?: NotificationHandlers) {
    const router = useRouter();
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);
    const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
    const [notification, setNotification] = useState<Notifications.Notification | null>(null);
    const notificationListener = useRef<Notifications.EventSubscription>(undefined);
    const responseListener = useRef<Notifications.EventSubscription>(undefined);

    const registerForPushNotifications = useCallback(async () => {
        if (!Device.isDevice) {
            console.log('Push notifications require a physical device');
            return null;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Push notification permission not granted');
            return null;
        }

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'KareKontrol',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                sound: 'default',
                lightColor: '#4F46E5',
                enableVibrate: true,
                enableLights: true,
            });
        }

        try {
            const projectId = Constants.expoConfig?.extra?.eas?.projectId;
            const token = await Notifications.getExpoPushTokenAsync({
                projectId,
            });
            return token.data;
        } catch (error) {
            console.error('Failed to get push token:', error);
            return null;
        }
    }, []);

    const registerTokenWithBackend = useCallback(async (token: string) => {
        try {
            await notificationEndpoints.registerPushToken({
                token,
                device_type: Platform.OS,
                device_name: Device.modelName || 'Unknown',
                is_active: true,
            });
            console.log('Push token registered with backend');
        } catch (error) {
            console.error('Failed to register push token:', error);
        }
    }, []);

    useEffect(() => {
        if (!isAuthenticated) return;

        registerForPushNotifications().then(token => {
            if (token) {
                setExpoPushToken(token);
                registerTokenWithBackend(token);
            }
        });

        notificationListener.current = Notifications.addNotificationReceivedListener(
            (notification) => {
                setNotification(notification);
                handlers?.onNotificationReceived?.(notification);
            }
        );

        responseListener.current = Notifications.addNotificationResponseReceivedListener(
            (response) => {
                const data = response.notification.request.content.data;
                handlers?.onNotificationResponse?.(response);

                if (data?.action_url && typeof data.action_url === 'string') {
                    const SAFE_PATTERNS = [
                        /^\/procedures\/\d+$/,
                        /^\/issues\/\d+$/,
                        /^\/entities\/\d+$/,
                        /^\/reports\/\d+$/,
                        /^\/notifications$/,
                    ];

                    const isSafe = SAFE_PATTERNS.some(p => p.test(data.action_url));
                    if (isSafe) {
                        const url = data.action_url
                            .replace(/^\/procedures\/(\d+)/, '/(main)/execution/$1')
                            .replace(/^\/issues\/(\d+)/, '/(main)/execution/issues/$1');
                        router.push(url as any);
                    } else {
                        router.push('/(main)/notifications' as any);
                    }
                } else {
                    router.push('/(main)/notifications' as any);
                }
            }
        );

        return () => {
            notificationListener.current?.remove();
            responseListener.current?.remove();
        };
    }, [isAuthenticated, registerForPushNotifications, registerTokenWithBackend, router, handlers]);

    return {
        expoPushToken,
        notification,
    };
}

export async function schedulePushNotification(title: string, body: string, data?: any) {
    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            data,
            sound: 'default',
        },
        trigger: null,
    });
}
