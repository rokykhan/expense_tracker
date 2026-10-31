import { fromBanglaDigits, toBanglaDigits } from '@/utils/bangla-digits';

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

export function formatMoney(paisa: number, symbol: string, useBanglaDigits: boolean): string {
  const formatted = formatPaisa(paisa, useBanglaDigits);
  if (formatted.startsWith('-')) {
    return `-${symbol}${formatted.slice(1)}`;
  }
  return `${symbol}${formatted}`;
}

export function paisaToInput(paisa: number): string {
  if (!Number.isInteger(paisa)) {
    throw new Error('Money must be an integer number of paisa.');
  }

  const sign = paisa < 0 ? '-' : '';
  const absolute = Math.abs(paisa);
  const taka = Math.trunc(absolute / 100);
  const fraction = absolute % 100;
  if (fraction === 0) {
    return `${sign}${taka}`;
  }
  return `${sign}${taka}.${String(fraction).padStart(2, '0')}`;
}

type ParseAmountOptions = {
  allowZero?: boolean;
  allowNegative?: boolean;
};

export function parseAmountToPaisa(input: string, options: ParseAmountOptions = {}): number | null {
  const cleaned = fromBanglaDigits(input).trim().replace(/,/g, '');
  const match = cleaned.match(/^(-)?(\d{1,12})(?:\.(\d{0,2}))?$/);
  if (!match) {
    return null;
  }

  const negative = match[1] === '-';
  if (negative && !options.allowNegative) {
    return null;
  }

  const taka = Number(match[2]);
  const fraction = Number((match[3] ?? '').padEnd(2, '0') || '0');
  const paisa = taka * 100 + fraction;
  if (!Number.isSafeInteger(paisa)) {
    return null;
  }

  const signed = negative ? -paisa : paisa;
  if (signed === 0 && !options.allowZero) {
    return null;
  }
  return signed;
}
