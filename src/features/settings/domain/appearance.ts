import { DEFAULT_ACCENT } from '@/db/seed';

export const ACCENT_PRESETS = [
  { light: DEFAULT_ACCENT, dark: '#9EC3DC' },
  { light: '#1F6B4A', dark: '#8FCBB0' },
  { light: '#8A5A12', dark: '#E2C48A' },
  { light: '#8E3B3B', dark: '#E3A8A8' },
  { light: '#5C3D6E', dark: '#CDB4DC' },
  { light: '#1D5C62', dark: '#9ED4D8' },
  { light: '#6B4A32', dark: '#D7BBA6' },
  { light: '#243044', dark: '#C5D0DE' },
] as const;

export type ThemeMode = 'light' | 'dark' | 'system';

export function isThemeMode(value: string): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function knownAccent(value: string | undefined): string {
  if (value && ACCENT_PRESETS.some((preset) => preset.light === value)) {
    return value;
  }
  return DEFAULT_ACCENT;
}

export function accentFor(scheme: 'light' | 'dark', stored: string): string {
  const preset = ACCENT_PRESETS.find((item) => item.light === knownAccent(stored)) ?? ACCENT_PRESETS[0];
  return preset[scheme];
}

export function resolveScheme(mode: ThemeMode, system: string | null | undefined): 'light' | 'dark' {
  if (mode === 'light' || mode === 'dark') {
    return mode;
  }
  return system === 'dark' ? 'dark' : 'light';
}
