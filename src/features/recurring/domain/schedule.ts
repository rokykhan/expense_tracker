import type { RecurringFrequency } from '@/db/types';
import { shiftDay } from '@/utils/date';

const MAX_OCCURRENCES = 4000;
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

export type ScheduleRule = {
  frequency: RecurringFrequency;
  interval: number;
  startDate: string;
  nextRunDate: string;
  endDate: string | null;
  isActive: boolean;
};

export type SchedulePlan = {
  dates: string[];
  nextRunDate: string;
  isActive: boolean;
};

export function planRecurring(rule: ScheduleRule, today: string): SchedulePlan {
  if (!rule.isActive || rule.interval < 1 || !isDayKey(rule.nextRunDate) || !isDayKey(rule.startDate)) {
    return { dates: [], nextRunDate: rule.nextRunDate, isActive: rule.isActive };
  }
  if (!isDayKey(today) || (rule.endDate != null && !isDayKey(rule.endDate))) {
    return { dates: [], nextRunDate: rule.nextRunDate, isActive: rule.isActive };
  }

  const dates: string[] = [];
  let cursor = rule.nextRunDate;

  while (cursor <= today && dates.length < MAX_OCCURRENCES) {
    if (rule.endDate && cursor > rule.endDate) {
      return { dates, nextRunDate: cursor, isActive: false };
    }
    dates.push(cursor);
    const upcoming = nextOccurrence(rule, cursor);
    if (upcoming <= cursor) {
      break;
    }
    cursor = upcoming;
  }

  if (rule.endDate && cursor > rule.endDate) {
    return { dates, nextRunDate: cursor, isActive: false };
  }
  return { dates, nextRunDate: cursor, isActive: true };
}

export function datesToInsert(planned: readonly string[], alreadyPosted: readonly string[]): string[] {
  const posted = new Set(alreadyPosted);
  return planned.filter((date) => !posted.has(date));
}

function nextOccurrence(rule: ScheduleRule, fromDate: string): string {
  if (rule.frequency === 'daily') {
    return shiftDay(fromDate, rule.interval);
  }
  if (rule.frequency === 'weekly') {
    return shiftDay(fromDate, rule.interval * 7);
  }
  const current = parseDayKey(fromDate);
  const anchor = parseDayKey(rule.startDate).day;
  const months = rule.frequency === 'yearly' ? rule.interval * 12 : rule.interval;
  return addMonths(current.year, current.month, anchor, months);
}

function addMonths(year: number, month: number, day: number, delta: number): string {
  const index = year * 12 + (month - 1) + delta;
  const nextYear = Math.floor(index / 12);
  const nextMonth = index - nextYear * 12 + 1;
  const nextDay = Math.min(day, daysInMonth(nextYear, nextMonth));
  return formatDayKey(nextYear, nextMonth, nextDay);
}

function isDayKey(value: string): boolean {
  if (!DAY_KEY.test(value)) {
    return false;
  }
  const { year, month, day } = parseDayKey(value);
  return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month);
}

function parseDayKey(value: string): { year: number; month: number; day: number } {
  const [year, month, day] = value.split('-').map(Number);
  return { year, month, day };
}

function formatDayKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
