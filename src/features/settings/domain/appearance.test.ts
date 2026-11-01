import { ACCENT_PRESETS, accentFor, knownAccent, resolveScheme } from '@/features/settings/domain/appearance';

function channelAverage(hex: string): number {
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  return (red + green + blue) / 3;
}

describe('appearance', () => {
  it('keeps dark accents light enough to read on black', () => {
    expect(ACCENT_PRESETS).toHaveLength(8);
    for (const preset of ACCENT_PRESETS) {
      expect(channelAverage(preset.light)).toBeLessThan(120);
      expect(channelAverage(preset.dark)).toBeGreaterThan(160);
      expect(accentFor('light', preset.light)).toBe(preset.light);
      expect(accentFor('dark', preset.light)).toBe(preset.dark);
    }
  });

  it('falls back to the default accent and follows an explicit theme', () => {
    expect(knownAccent('#FFFFFF')).toBe(ACCENT_PRESETS[0].light);
    expect(accentFor('dark', 'nope')).toBe(ACCENT_PRESETS[0].dark);
    expect(resolveScheme('dark', 'light')).toBe('dark');
    expect(resolveScheme('system', 'dark')).toBe('dark');
    expect(resolveScheme('system', 'light')).toBe('light');
  });
});
