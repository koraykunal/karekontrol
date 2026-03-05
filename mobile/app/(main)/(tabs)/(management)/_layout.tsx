import { Stack } from 'expo-router';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Colors } from '@/src/constants/theme';

export default function ManagementLayout() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: theme.background },
                headerTintColor: theme.text,
                headerTitleStyle: { fontWeight: '600' },
                contentStyle: { backgroundColor: theme.backgroundSecondary },
            }}
        >
            <Stack.Screen
                name="index"
                options={{ title: 'Yönetim Paneli' }}
            />
            <Stack.Screen
                name="entities/index"
                options={{ title: 'Varlık Yönetimi' }}
            />
            <Stack.Screen
                name="entities/[id]"
                options={{ title: 'Varlık Düzenle' }}
            />
            <Stack.Screen
                name="procedures/index"
                options={{ title: 'Prosedür Yönetimi' }}
            />
            <Stack.Screen
                name="procedures/create"
                options={{ title: 'Yeni Prosedür' }}
            />
            <Stack.Screen
                name="procedures/[id]"
                options={{ title: 'Prosedür Düzenle' }}
            />
            <Stack.Screen
                name="users/index"
                options={{ title: 'Kullanıcı Yönetimi' }}
            />
            <Stack.Screen
                name="users/[id]"
                options={{ title: 'Kullanıcı Düzenle' }}
            />
            <Stack.Screen
                name="permissions"
                options={{ title: 'Yetki Yönetimi' }}
            />
        </Stack>
    );
}
