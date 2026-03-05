import { notificationEndpoints } from '../endpoints/notification.endpoints';

export const notificationService = {
    getNotifications: async (params?: any) => {
        const response = await notificationEndpoints.getNotifications(params);
        return response.data;
    },

    getUnreadCount: async () => {
        const response = await notificationEndpoints.getUnreadCount();
        return response.data;
    },

    markAsRead: async (id: number) => {
        const response = await notificationEndpoints.markAsRead(id);
        return response.data;
    },

    markAllAsRead: async () => {
        await notificationEndpoints.markAllAsRead();
    },

    deleteNotification: async (id: number) => {
        await notificationEndpoints.deleteNotification(id);
    },

    registerPushToken: async (token: string, deviceType?: string, deviceName?: string) => {
        await notificationEndpoints.registerPushToken({
            token,
            device_type: deviceType || 'unknown',
            device_name: deviceName || 'unknown',
            is_active: true
        });
    },

};
