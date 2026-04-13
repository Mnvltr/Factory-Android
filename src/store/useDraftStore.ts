import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DRAFTS_KEY = 'factory_drafts';

interface DraftState {
  drafts: Record<string, string>;
  setDraft: (sessionId: string, text: string) => Promise<void>;
  getDraft: (sessionId: string) => string;
  clearDraft: (sessionId: string) => Promise<void>;
  load: () => Promise<void>;
}

export const useDraftStore = create<DraftState>((set, get) => ({
  drafts: {},

  setDraft: async (sessionId: string, text: string) => {
    const next = {...get().drafts, [sessionId]: text};
    if (!text) {
      delete next[sessionId];
    }
    set({drafts: next});
    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(next));
  },

  getDraft: (sessionId: string) => {
    return get().drafts[sessionId] || '';
  },

  clearDraft: async (sessionId: string) => {
    const next = {...get().drafts};
    delete next[sessionId];
    set({drafts: next});
    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(next));
  },

  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(DRAFTS_KEY);
      if (raw) {
        set({drafts: JSON.parse(raw)});
      }
    } catch {
      // ignore
    }
  },
}));
