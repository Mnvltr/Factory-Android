import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = 'factory_settings';

export type ReasoningEffort =
  | 'dynamic'
  | 'off'
  | 'minimal'
  | 'low'
  | 'medium'
  | 'high'
  | 'xhigh'
  | 'max';

export type InteractionMode = 'auto' | 'spec' | 'agi';
export type AutonomyLevel = 'off' | 'low' | 'medium' | 'high';

export interface FactorySettings {
  model: string;
  reasoningEffort: ReasoningEffort;
  interactionMode: InteractionMode;
  autonomyLevel: AutonomyLevel;
  defaultComputerId: string;
}

interface SettingsState extends FactorySettings {
  update: (partial: Partial<FactorySettings>) => Promise<void>;
  load: () => Promise<void>;
}

const DEFAULTS: FactorySettings = {
  model: '',
  reasoningEffort: 'dynamic',
  interactionMode: 'auto',
  autonomyLevel: 'medium',
  defaultComputerId: '',
};

export const REASONING_OPTIONS: ReasoningEffort[] = [
  'dynamic',
  'off',
  'minimal',
  'low',
  'medium',
  'high',
  'xhigh',
  'max',
];

export const INTERACTION_OPTIONS: InteractionMode[] = ['auto', 'spec', 'agi'];
export const AUTONOMY_OPTIONS: AutonomyLevel[] = [
  'off',
  'low',
  'medium',
  'high',
];

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULTS,

  update: async (partial: Partial<FactorySettings>) => {
    const next = {...get(), ...partial};
    set(partial);
    const {
      model,
      reasoningEffort,
      interactionMode,
      autonomyLevel,
      defaultComputerId,
    } = next;
    await AsyncStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        model,
        reasoningEffort,
        interactionMode,
        autonomyLevel,
        defaultComputerId,
      }),
    );
  },

  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      if (!raw) {
        return;
      }
      const data = JSON.parse(raw);
      set({
        model: data.model ?? DEFAULTS.model,
        reasoningEffort: data.reasoningEffort ?? DEFAULTS.reasoningEffort,
        interactionMode: data.interactionMode ?? DEFAULTS.interactionMode,
        autonomyLevel: data.autonomyLevel ?? DEFAULTS.autonomyLevel,
        defaultComputerId: data.defaultComputerId ?? DEFAULTS.defaultComputerId,
      });
    } catch {
      // ignore
    }
  },
}));
