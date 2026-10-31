import { datesToInsert, planRecurring, type ScheduleRule } from '@/features/recurring/domain/schedule';

function monthlyRule(overrides: Partial<ScheduleRule> = {}): ScheduleRule {
  return {
    frequency: 'monthly',
    interval: 1,
    startDate: '2026-01-15',
    nextRunDate: '2026-01-15',
    endDate: null,
    isActive: true,
    ...overrides,
  };
}

describe('planRecurring', () => {
  it('creates one entry for each missed month, including today', () => {
    const plan = planRecurring(monthlyRule(), '2026-03-15');

    expect(plan.dates).toEqual(['2026-01-15', '2026-02-15', '2026-03-15']);
    expect(plan.nextRunDate).toBe('2026-04-15');
    expect(plan.isActive).toBe(true);
  });

  it('does not plan the same dates again after the next run moves forward', () => {
    const first = planRecurring(monthlyRule(), '2026-03-15');
    const second = planRecurring(monthlyRule({ nextRunDate: first.nextRunDate }), '2026-03-15');

    expect(second.dates).toEqual([]);
    expect(second.nextRunDate).toBe('2026-04-15');
  });

  it('skips dates that were already posted', () => {
    const plan = planRecurring(monthlyRule(), '2026-03-15');

    expect(datesToInsert(plan.dates, ['2026-01-15'])).toEqual(['2026-02-15', '2026-03-15']);
    expect(datesToInsert(plan.dates, plan.dates)).toEqual([]);
  });

  it('clamps a 31st start onto the last day of a short month', () => {
    const plan = planRecurring(
      monthlyRule({ startDate: '2025-01-31', nextRunDate: '2025-01-31' }),
      '2025-03-31',
    );

    expect(plan.dates).toEqual(['2025-01-31', '2025-02-28', '2025-03-31']);
  });

  it('keeps the 29th in a later leap year', () => {
    const plan = planRecurring(
      monthlyRule({
        frequency: 'yearly',
        startDate: '2024-02-29',
        nextRunDate: '2024-02-29',
      }),
      '2028-02-29',
    );

    expect(plan.dates).toEqual(['2024-02-29', '2025-02-28', '2026-02-28', '2027-02-28', '2028-02-29']);
  });

  it('stops on the end date and turns the rule off', () => {
    const plan = planRecurring(monthlyRule({ endDate: '2026-02-15' }), '2026-04-15');

    expect(plan.dates).toEqual(['2026-01-15', '2026-02-15']);
    expect(plan.nextRunDate).toBe('2026-03-15');
    expect(plan.isActive).toBe(false);
  });

  it('steps daily and weekly intervals', () => {
    const daily = planRecurring(
      monthlyRule({ frequency: 'daily', interval: 2, startDate: '2026-01-01', nextRunDate: '2026-01-01' }),
      '2026-01-05',
    );
    const weekly = planRecurring(
      monthlyRule({ frequency: 'weekly', startDate: '2026-01-05', nextRunDate: '2026-01-05' }),
      '2026-01-19',
    );

    expect(daily.dates).toEqual(['2026-01-01', '2026-01-03', '2026-01-05']);
    expect(weekly.dates).toEqual(['2026-01-05', '2026-01-12', '2026-01-19']);
  });

  it('leaves an inactive rule or a future date unchanged', () => {
    expect(planRecurring(monthlyRule({ isActive: false }), '2026-03-15').dates).toEqual([]);
    expect(planRecurring(monthlyRule({ nextRunDate: '2026-04-15' }), '2026-03-15')).toEqual({
      dates: [],
      nextRunDate: '2026-04-15',
      isActive: true,
    });
  });
});
