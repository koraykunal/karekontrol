import {QueryClient} from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import {useAppStore} from '../zustand/app.store';
import {useOfflineStore} from '../zustand/offline.store';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 2,
            staleTime: 5 * 60 * 1000,
            gcTime: 30 * 60 * 1000,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            refetchOnMount: false,
            networkMode: 'offlineFirst',
        },
        mutations: {
            retry: 1,
            networkMode: 'offlineFirst',
        },
    },
});

export const unsubscribeNetInfo = NetInfo.addEventListener(state => {
    const isOnline = state.isConnected === true && state.isInternetReachable === true;
    useAppStore.getState().setOnlineStatus(isOnline);

    if (isOnline) {
        queryClient.resumePausedMutations()
            .then(() => {
                queryClient.invalidateQueries({
                    predicate: (query) => {
                        const queryKey = query.queryKey[0] as string;
                        return ['entities', 'procedures', 'procedureLogs', 'issues', 'entityHistory'].includes(queryKey);
                    }
                });
            });

        useOfflineStore.getState().processQueue();
    }
});

export default queryClient;
