export function goalSaved(deposits: readonly number[]): number {
  return deposits.reduce((sum, amount) => sum + amount, 0);
}

export function goalProgress(target: number, deposits: readonly number[]): {
  saved: number;
  ratio: number;
  completed: boolean;
} {
  const saved = goalSaved(deposits);
  return {
    saved,
    ratio: target <= 0 ? 0 : saved / target,
    completed: target > 0 && saved >= target,
  };
}

export function withdrawalAllowed(saved: number, amount: number): boolean {
  return amount > 0 && amount <= saved;
}
