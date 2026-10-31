import { toBanglaDigits } from '@/utils/bangla-digits';

export function formatPaisa(paisa: number, useBanglaDigits: boolean): string {
  if (!Number.isInteger(paisa)) {
    throw new Error('Money must be an integer number of paisa.');
  }

  const sign = paisa < 0 ? '-' : '';
  const absolute = Math.abs(paisa);
  const taka = Math.trunc(absolute / 100);
  const fraction = absolute % 100;
  const formattedTaka = new Intl.NumberFormat('bn-BD', {
    numberingSystem: useBanglaDigits ? 'beng' : 'latn',
    maximumFractionDigits: 0,
  }).format(taka);
  const fractionText = String(fraction).padStart(2, '0');
  const fractionDisplay = useBanglaDigits ? toBanglaDigits(fractionText) : fractionText;

  return `${sign}${formattedTaka}.${fractionDisplay}`;
}
