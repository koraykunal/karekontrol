import { Stack } from 'expo-router';
import { View } from 'react-native';
import { AppHeader } from '@/src/components/layout';
import { Colors } from '@/src/constants/theme';
import { useColorScheme } from '@/src/hooks/use-color-scheme';

export default function MainLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <AppHeader />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="(entities)"
          options={{
            headerShown: false,
            presentation: 'card',
            animation: 'slide_from_right'
          }}
        />
        <Stack.Screen name="execution" options={{ headerShown: false }} />
        <Stack.Screen name="(issues)" options={{ headerShown: false }} />
        <Stack.Screen name="(reports)" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}
