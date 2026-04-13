import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AccentName,
  buildDarkPalette,
  buildLightPalette,
  FontSizeKey,
  FONT_SIZES,
  Palette,
} from '../theme/colors';

const THEME_KEY = 'factory_theme';

interface ThemeState {
  isDark: boolean;
  accent: AccentName;
  fontSize: FontSizeKey;
  palette: Palette;
  fonts: (typeof FONT_SIZES)[FontSizeKey];
  setDark: (v: boolean) => Promise<void>;
  setAccent: (v: AccentName) => Promise<void>;
  setFontSize: (v: FontSizeKey) => Promise<void>;
  load: () => Promise<void>;
}

function makePalette(isDark: boolean, accent: AccentName) {
  return isDark ? buildDarkPalette(accent) : buildLightPalette(accent);
}

async function persist(state: {
  isDark: boolean;
  accent: AccentName;
  fontSize: FontSizeKey;
}) {
  await AsyncStorage.setItem(THEME_KEY, JSON.stringify(state));
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: false,
  accent: 'blue',
  fontSize: 'medium',
  palette: buildLightPalette('blue'),
  fonts: FONT_SIZES.medium,

  setDark: async (isDark: boolean) => {
    const {accent, fontSize} = get();
    set({isDark, palette: makePalette(isDark, accent)});
    await persist({isDark, accent, fontSize});
  },

  setAccent: async (accent: AccentName) => {
    const {isDark, fontSize} = get();
    set({accent, palette: makePalette(isDark, accent)});
    await persist({isDark, accent, fontSize});
  },

  setFontSize: async (fontSize: FontSizeKey) => {
    const {isDark, accent} = get();
    set({fontSize, fonts: FONT_SIZES[fontSize]});
    await persist({isDark, accent, fontSize});
  },

  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(THEME_KEY);
      if (!raw) {
        return;
      }
      const data = JSON.parse(raw);
      const isDark = data.isDark ?? false;
      const accent = data.accent ?? 'blue';
      const fontSize: FontSizeKey =
        data.fontSize === 'small' || data.fontSize === 'large'
          ? data.fontSize
          : 'medium';
      set({
        isDark,
        accent,
        fontSize,
        palette: makePalette(isDark, accent),
        fonts: FONT_SIZES[fontSize],
      });
    } catch {
      // ignore
    }
  },
}));
