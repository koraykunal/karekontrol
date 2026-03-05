import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../../api/client';

interface OfflineAction {
  id: string;
  type: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  data?: any;
  timestamp: number;
  retryCount: number;
}

interface OfflineState {
  queue: OfflineAction[];
  isProcessing: boolean;

  addToQueue: (action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) => void;
  removeFromQueue: (id: string) => void;
  processQueue: () => Promise<void>;
  clearQueue: () => void;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      queue: [],
      isProcessing: false,

      addToQueue: (action) => {
        const newAction: OfflineAction = {
          ...action,
          id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
          timestamp: Date.now(),
          retryCount: 0,
        };

        set((state) => ({
          queue: [...state.queue, newAction],
        }));
      },

      removeFromQueue: (id) => {
        set((state) => ({
          queue: state.queue.filter((action) => action.id !== id),
        }));
      },

      processQueue: async () => {
        const { queue, isProcessing } = get();
        if (isProcessing || queue.length === 0) return;

        const { useAuthStore } = await import('../zustand/auth.store');
        if (!useAuthStore.getState().isAuthenticated) return;

        set({ isProcessing: true });

        try {
          for (const action of queue) {
            try {
              await apiClient.request({
                method: action.type,
                url: action.endpoint,
                data: action.data,
              });
              get().removeFromQueue(action.id);
            } catch {
              const updatedQueue = get().queue.map((a) =>
                a.id === action.id ? { ...a, retryCount: a.retryCount + 1 } : a
              );
              const filteredQueue = updatedQueue.filter((a) => a.retryCount < 5);
              set({ queue: filteredQueue });
            }
          }
        } finally {
          set({ isProcessing: false });
        }
      },

      clearQueue: () => {
        set({ queue: [] });
      },
    }),
    {
      name: 'offline-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ queue: state.queue }),
    }
  )
);
