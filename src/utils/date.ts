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
