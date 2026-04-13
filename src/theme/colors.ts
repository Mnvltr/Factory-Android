export type AccentName = 'blue' | 'green' | 'purple' | 'orange' | 'red';

export interface Palette {
  bg: string;
  surface: string;
  surfaceSecondary: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  accent: string;
  accentLight: string;
  userBubble: string;
  userBubbleText: string;
  assistantBubble: string;
  assistantBubbleText: string;
  toolBg: string;
  toolBorder: string;
  inputBg: string;
  headerBg: string;
  headerText: string;
  statusIdle: string;
  statusRunning: string;
  statusPending: string;
  danger: string;
  fab: string;
  fabText: string;
  shimmer: string;
}

const ACCENTS: Record<AccentName, {main: string; light: string}> = {
  blue: {main: '#2563eb', light: '#dbeafe'},
  green: {main: '#16a34a', light: '#dcfce7'},
  purple: {main: '#7c3aed', light: '#ede9fe'},
  orange: {main: '#ea580c', light: '#fff7ed'},
  red: {main: '#dc2626', light: '#fee2e2'},
};

export function buildLightPalette(accent: AccentName): Palette {
  const a = ACCENTS[accent];
  return {
    bg: '#f5f5f5',
    surface: '#ffffff',
    surfaceSecondary: '#f0f0f0',
    text: '#0f172a',
    textSecondary: '#64748b',
    textTertiary: '#94a3b8',
    border: '#e2e8f0',
    accent: a.main,
    accentLight: a.light,
    userBubble: a.main,
    userBubbleText: '#ffffff',
    assistantBubble: '#ffffff',
    assistantBubbleText: '#0f172a',
    toolBg: '#f8fafc',
    toolBorder: '#e2e8f0',
    inputBg: '#f1f5f9',
    headerBg: '#ffffff',
    headerText: '#0f172a',
    statusIdle: '#22c55e',
    statusRunning: a.main,
    statusPending: '#f59e0b',
    danger: '#ef4444',
    fab: a.main,
    fabText: '#ffffff',
    shimmer: '#e2e8f0',
  };
}

export function buildDarkPalette(accent: AccentName): Palette {
  const a = ACCENTS[accent];
  return {
    bg: '#0f172a',
    surface: '#1e293b',
    surfaceSecondary: '#334155',
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    textTertiary: '#64748b',
    border: '#334155',
    accent: a.main,
    accentLight: a.light,
    userBubble: a.main,
    userBubbleText: '#ffffff',
    assistantBubble: '#1e293b',
    assistantBubbleText: '#f1f5f9',
    toolBg: '#1e293b',
    toolBorder: '#475569',
    inputBg: '#1e293b',
    headerBg: '#1e293b',
    headerText: '#f1f5f9',
    statusIdle: '#22c55e',
    statusRunning: a.main,
    statusPending: '#f59e0b',
    danger: '#ef4444',
    fab: a.main,
    fabText: '#ffffff',
    shimmer: '#334155',
  };
}

export const ACCENT_OPTIONS: {name: AccentName; color: string}[] = [
  {name: 'blue', color: '#2563eb'},
  {name: 'green', color: '#16a34a'},
  {name: 'purple', color: '#7c3aed'},
  {name: 'orange', color: '#ea580c'},
  {name: 'red', color: '#dc2626'},
];

export const FONT_SIZES = {
  small: {body: 13, title: 14, heading: 28},
  medium: {body: 15, title: 16, heading: 34},
  large: {body: 17, title: 18, heading: 38},
} as const;

export type FontSizeKey = keyof typeof FONT_SIZES;
