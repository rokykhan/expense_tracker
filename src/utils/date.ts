export function dhakaDayKey(isoUtc: string): string {
  const date = new Date(isoUtc);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date.');
  }

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  if (!year || !month || !day) {
    throw new Error('Invalid date.');
  }
  return `${year}-${month}-${day}`;
}

export function dhakaDateToIso(year: number, month: number, day: number): string {
  const utcMs = Date.UTC(year, month - 1, day) - 6 * 60 * 60 * 1000;
  return new Date(utcMs).toISOString();
}

export function dhakaDateTimeToIso(year: number, month: number, day: number, hour: number, minute: number): string {
  const utcMs = Date.UTC(year, month - 1, day, hour, minute) - 6 * 60 * 60 * 1000;
  return new Date(utcMs).toISOString();
}

export function dhakaClock(isoUtc: string): { hour: number; minute: number } {
  const date = new Date(isoUtc);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date.');
  }
  const shifted = new Date(date.getTime() + 6 * 60 * 60 * 1000);
  return { hour: shifted.getUTCHours(), minute: shifted.getUTCMinutes() };
}

export function dhakaMonthBounds(year: number, month: number): { startMs: number; endMs: number } {
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  return {
    startMs: Date.parse(dhakaDateToIso(year, month, 1)),
    endMs: Date.parse(dhakaDateToIso(nextYear, nextMonth, 1)),
  };
}

export function currentDhakaMonth(now = new Date()): { year: number; month: number } {
  const [year, month] = dhakaDayKey(now.toISOString()).split('-').map(Number);
  return { year, month };
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const index = year * 12 + (month - 1) + delta;
  const nextYear = Math.floor(index / 12);
  return { year: nextYear, month: index - nextYear * 12 + 1 };
}

export function shiftDay(dayKey: string, delta: number): string {
  const [year, month, day] = dayKey.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + delta));
  const nextYear = shifted.getUTCFullYear();
  const nextMonth = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const nextDay = String(shifted.getUTCDate()).padStart(2, '0');
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

export function todayDhakaDayKey(now = new Date()): string {
  return dhakaDayKey(now.toISOString());
}

export function formatMonthDhaka(year: number, month: number, useBanglaDigits: boolean): string {
  return new Intl.DateTimeFormat('bn-BD', {
    timeZone: 'Asia/Dhaka',
    month: 'long',
    year: 'numeric',
    numberingSystem: useBanglaDigits ? 'beng' : 'latn',
  }).format(new Date(dhakaDateToIso(year, month, 15)));
}

export function formatDateDhaka(isoUtc: string, useBanglaDigits = true): string {
  const date = new Date(isoUtc);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date.');
  }

  return new Intl.DateTimeFormat('bn-BD', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    numberingSystem: useBanglaDigits ? 'beng' : 'latn',
  }).format(date);
}
