import { useEffect } from 'react';
import { Slot, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { initSentry } from '@/src/utils/sentry';
import { queryClient } from '@/src/store/react-query/query-client';
import { useAuthStore } from '@/src/store/zustand/auth.store';
import { NotificationProvider } from '@/src/providers/NotificationProvider';
import { logger } from '@/src/utils/logger';
import { ErrorBoundary } from '@/src/components/common/ErrorBoundary';

initSentry();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isInitialized = useAuthStore(state => state.isInitialized);

  useEffect(() => {
    if (!rootNavigationState?.key) return;

    if (!isInitialized) {
      logger.log('⏳ Store not initialized yet');
      return;
    }

    logger.log('🔐 Auth guard check:', { isAuthenticated, segments: segments[0], isInitialized });

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      logger.log('➡️ Redirecting to login (not authenticated)');
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 0);
    } else if (isAuthenticated && inAuthGroup) {
      logger.log('➡️ Redirecting to dashboard (authenticated)');
      setTimeout(() => {
        router.replace('/(main)/(tabs)/(dashboard)');
      }, 0);
    }
  }, [isAuthenticated, segments, isInitialized, router, rootNavigationState?.key]);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <NotificationProvider>
              <Slot />
              <StatusBar style="auto" />
            </NotificationProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

