import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY_STORAGE = 'factory_api_key';

interface AppStore {
  apiKey: string;
  setApiKey: (key: string) => Promise<void>;
  loadApiKey: () => Promise<void>;
}

export const useStore = create<AppStore>(set => ({
  apiKey: '',
  setApiKey: async (key: string) => {
    await AsyncStorage.setItem(API_KEY_STORAGE, key);
    set({apiKey: key});
  },
  loadApiKey: async () => {
    const key = await AsyncStorage.getItem(API_KEY_STORAGE);
    if (key) {
      set({apiKey: key});
    }
  },
}));
