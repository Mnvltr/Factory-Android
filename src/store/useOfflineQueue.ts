import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {postMessage} from '../api/factoryApi';

const QUEUE_KEY = 'factory_offline_queue';

export interface QueuedMessage {
  id: string;
  sessionId: string;
  text: string;
  createdAt: number;
  retryCount: number;
  status: 'queued' | 'sending' | 'failed';
}

interface OfflineQueueState {
  queue: QueuedMessage[];
  enqueue: (sessionId: string, text: string) => Promise<string>;
  dequeue: (id: string) => Promise<void>;
  processQueue: (apiKey: string) => Promise<void>;
  load: () => Promise<void>;
  getSessionQueue: (sessionId: string) => QueuedMessage[];
}

async function persistQueue(queue: QueuedMessage[]) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export const useOfflineQueue = create<OfflineQueueState>((set, get) => ({
  queue: [],

  enqueue: async (sessionId: string, text: string) => {
    const id = `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const item: QueuedMessage = {
      id,
      sessionId,
      text,
      createdAt: Date.now(),
      retryCount: 0,
      status: 'queued',
    };
    const next = [...get().queue, item];
    set({queue: next});
    await persistQueue(next);
    return id;
  },

  dequeue: async (id: string) => {
    const next = get().queue.filter(q => q.id !== id);
    set({queue: next});
    await persistQueue(next);
  },

  processQueue: async (apiKey: string) => {
    const {queue} = get();
    const pending = queue.filter(q => q.status === 'queued');
    if (pending.length === 0) {
      return;
    }

    for (const item of pending) {
      const updated = get().queue.map(q =>
        q.id === item.id ? {...q, status: 'sending' as const} : q,
      );
      set({queue: updated});

      try {
        await postMessage(apiKey, item.sessionId, item.text);
        const next = get().queue.filter(q => q.id !== item.id);
        set({queue: next});
        await persistQueue(next);
      } catch {
        const next = get().queue.map(q =>
          q.id === item.id
            ? {
                ...q,
                status: (q.retryCount >= 3 ? 'failed' : 'queued') as
                  | 'queued'
                  | 'failed',
                retryCount: q.retryCount + 1,
              }
            : q,
        );
        set({queue: next});
        await persistQueue(next);
      }
    }
  },

  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      if (raw) {
        const data: QueuedMessage[] = JSON.parse(raw);
        const reset = data.map(q => ({
          ...q,
          status: (q.status === 'sending' ? 'queued' : q.status) as
            | 'queued'
            | 'sending'
            | 'failed',
        }));
        set({queue: reset});
      }
    } catch {
      // ignore
    }
  },

  getSessionQueue: (sessionId: string) => {
    return get().queue.filter(q => q.sessionId === sessionId);
  },
}));
