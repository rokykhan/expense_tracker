const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'] as const;

export function toBanglaDigits(value: string): string {
  return value.replace(/[0-9]/g, (digit) => BENGALI_DIGITS[Number(digit)] ?? digit);
}

const BENGALI_DIGIT_TEXT = '০১২৩৪৫৬৭৮৯';

export function fromBanglaDigits(value: string): string {
  return value.replace(/[০-৯]/g, (digit) => String(BENGALI_DIGIT_TEXT.indexOf(digit)));
}
