import type { SQLiteDatabase } from 'expo-sqlite';

import { goalSaved } from '@/features/savings/domain/progress';

export type GoalRecord = {
  id: number;
  name: string;
  targetAmount: number;
  deadline: string | null;
  icon: string;
  color: string;
  isCompleted: boolean;
};

export type DepositRecord = {
  id: number;
  goalId: number;
  amount: number;
  occurredAt: string;
  note: string | null;
};

type GoalRow = {
  id: number;
  name: string;
  target_amount: number;
  deadline: string | null;
  icon: string;
  color: string;
  is_completed: number;
};

type DepositRow = {
  id: number;
  goal_id: number;
  amount: number;
  occurred_at: string;
  note: string | null;
};

function mapGoal(row: GoalRow): GoalRecord {
  return {
    id: Number(row.id),
    name: row.name,
    targetAmount: Number(row.target_amount),
    deadline: row.deadline,
    icon: row.icon,
    color: row.color,
    isCompleted: Number(row.is_completed) === 1,
  };
}

function mapDeposit(row: DepositRow): DepositRecord {
  return {
    id: Number(row.id),
    goalId: Number(row.goal_id),
    amount: Number(row.amount),
    occurredAt: row.occurred_at,
    note: row.note,
  };
}

export async function listGoals(db: SQLiteDatabase): Promise<GoalRecord[]> {
  const rows = await db.getAllAsync<GoalRow>(
    'SELECT id, name, target_amount, deadline, icon, color, is_completed FROM savings_goals ORDER BY is_completed ASC, id DESC',
  );
  return rows.map(mapGoal);
}

export async function listDeposits(db: SQLiteDatabase): Promise<DepositRecord[]> {
  const rows = await db.getAllAsync<DepositRow>(
    'SELECT id, goal_id, amount, occurred_at, note FROM savings_deposits ORDER BY occurred_at DESC, id DESC',
  );
  return rows.map(mapDeposit);
}

export async function saveGoal(
  db: SQLiteDatabase,
  input: { id?: number; name: string; targetAmount: number; deadline: string | null; icon: string; color: string },
): Promise<void> {
  const now = new Date().toISOString();
  if (input.id == null) {
    await db.runAsync(
      `INSERT INTO savings_goals (name, target_amount, deadline, icon, color, is_completed, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
      input.name,
      input.targetAmount,
      input.deadline,
      input.icon,
      input.color,
      now,
      now,
    );
    return;
  }

  const deposits = (await listDeposits(db)).filter((deposit) => deposit.goalId === input.id);
  const completed = goalSaved(deposits.map((deposit) => deposit.amount)) >= input.targetAmount;
  await db.runAsync(
    `UPDATE savings_goals
     SET name = ?, target_amount = ?, deadline = ?, icon = ?, color = ?, is_completed = ?, updated_at = ?
     WHERE id = ?`,
    input.name,
    input.targetAmount,
    input.deadline,
    input.icon,
    input.color,
    completed ? 1 : 0,
    now,
    input.id,
  );
}

export async function addDeposit(
  db: SQLiteDatabase,
  input: { goalId: number; amount: number; occurredAt: string; note: string | null },
): Promise<void> {
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO savings_deposits (goal_id, amount, occurred_at, note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      input.goalId,
      input.amount,
      input.occurredAt,
      input.note,
      now,
      now,
    );
    await refreshCompleted(db, input.goalId, now);
  });
}

export async function deleteDeposit(db: SQLiteDatabase, depositId: number, goalId: number): Promise<void> {
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM savings_deposits WHERE id = ?', depositId);
    await refreshCompleted(db, goalId, now);
  });
}

export async function deleteGoal(db: SQLiteDatabase, goalId: number): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM savings_deposits WHERE goal_id = ?', goalId);
    await db.runAsync('DELETE FROM savings_goals WHERE id = ?', goalId);
  });
}

async function refreshCompleted(db: SQLiteDatabase, goalId: number, now: string): Promise<void> {
  const goal = await db.getFirstAsync<{ target_amount: number }>(
    'SELECT target_amount FROM savings_goals WHERE id = ?',
    goalId,
  );
  const deposits = await db.getAllAsync<{ amount: number }>(
    'SELECT amount FROM savings_deposits WHERE goal_id = ?',
    goalId,
  );
  const saved = goalSaved(deposits.map((row) => Number(row.amount)));
  const completed = goal != null && saved >= Number(goal.target_amount);
  await db.runAsync(
    'UPDATE savings_goals SET is_completed = ?, updated_at = ? WHERE id = ?',
    completed ? 1 : 0,
    now,
    goalId,
  );
}
