import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/store/zustand/auth.store';
import { Colors } from '@/src/constants/theme';
import { useColorScheme } from '@/src/hooks/use-color-scheme';

export default function TabsLayout() {
    const user = useAuthStore(state => state.user);
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const canManage = user?.is_admin || user?.is_manager || user?.is_super_admin || (user?.permissions?.access_management as any)?.enabled;

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: theme.primary,
                tabBarInactiveTintColor: theme.textSecondary,
                tabBarStyle: {
                    backgroundColor: theme.background,
                    borderTopColor: theme.border,
                },
            }}
        >
            <Tabs.Screen
                name="(dashboard)"
                options={{
                    title: 'Ana Sayfa',
                    tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
                }}
            />

            {/* Management tab - only visible to admins and managers */}
            <Tabs.Screen
                name="(management)"
                options={{
                    title: 'Yönetim',
                    tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
                    href: canManage ? undefined : null, // Hide tab if user can't manage
                }}
            />

            <Tabs.Screen
                name="(profile)"
                options={{
                    title: 'Profil',
                    tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
                }}
            />
        </Tabs>
    );
}
