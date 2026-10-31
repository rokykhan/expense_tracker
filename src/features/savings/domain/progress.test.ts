import { goalProgress, withdrawalAllowed } from '@/features/savings/domain/progress';

describe('savings progress', () => {
  it('subtracts a withdrawal and completes at the target', () => {
    expect(goalProgress(10000, [6000, -1000])).toEqual({ saved: 5000, ratio: 0.5, completed: false });
    expect(goalProgress(10000, [6000, 4000]).completed).toBe(true);
  });

  it('refuses a withdrawal larger than the saved amount', () => {
    expect(withdrawalAllowed(5000, 5000)).toBe(true);
    expect(withdrawalAllowed(5000, 5001)).toBe(false);
  });
});
