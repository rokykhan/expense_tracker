import type { SQLiteDatabase } from 'expo-sqlite';

import type { DebtKind, TransactionKind } from '@/db/types';
import { debtRemaining } from '@/features/debts/domain/remaining';

export type DebtRecord = {
  id: number;
  personName: string;
  kind: DebtKind;
  amount: number;
  occurredAt: string;
  dueDate: string | null;
  note: string | null;
  isSettled: boolean;
  linkedAccountId: number | null;
};

export type PaymentRecord = {
  id: number;
  debtId: number;
  amount: number;
  occurredAt: string;
  note: string | null;
};

type DebtRow = {
  id: number;
  person_name: string;
  kind: DebtKind;
  amount: number;
  occurred_at: string;
  due_date: string | null;
  note: string | null;
  is_settled: number;
  linked_account_id: number | null;
};

type PaymentRow = {
  id: number;
  debt_id: number;
  amount: number;
  occurred_at: string;
  note: string | null;
};

function mapDebt(row: DebtRow): DebtRecord {
  return {
    id: Number(row.id),
    personName: row.person_name,
    kind: row.kind,
    amount: Number(row.amount),
    occurredAt: row.occurred_at,
    dueDate: row.due_date,
    note: row.note,
    isSettled: Number(row.is_settled) === 1,
    linkedAccountId: row.linked_account_id == null ? null : Number(row.linked_account_id),
  };
}

function mapPayment(row: PaymentRow): PaymentRecord {
  return {
    id: Number(row.id),
    debtId: Number(row.debt_id),
    amount: Number(row.amount),
    occurredAt: row.occurred_at,
    note: row.note,
  };
}

export async function listDebts(db: SQLiteDatabase): Promise<DebtRecord[]> {
  const rows = await db.getAllAsync<DebtRow>(
    `SELECT id, person_name, kind, amount, occurred_at, due_date, note, is_settled, linked_account_id
     FROM debts
     ORDER BY is_settled ASC, due_date ASC, id DESC`,
  );
  return rows.map(mapDebt);
}

export async function listPayments(db: SQLiteDatabase): Promise<PaymentRecord[]> {
  const rows = await db.getAllAsync<PaymentRow>(
    'SELECT id, debt_id, amount, occurred_at, note FROM debt_payments ORDER BY occurred_at DESC, id DESC',
  );
  return rows.map(mapPayment);
}

export async function saveDebt(
  db: SQLiteDatabase,
  input: {
    id?: number;
    personName: string;
    kind: DebtKind;
    amount: number;
    occurredAt: string;
    dueDate: string | null;
    note: string | null;
    linkedAccountId: number | null;
  },
): Promise<void> {
  const now = new Date().toISOString();
  if (input.id != null) {
    await db.runAsync(
      `UPDATE debts
       SET person_name = ?, kind = ?, amount = ?, occurred_at = ?, due_date = ?, note = ?, updated_at = ?
       WHERE id = ?`,
      input.personName,
      input.kind,
      input.amount,
      input.occurredAt,
      input.dueDate,
      input.note,
      now,
      input.id,
    );
    return;
  }

  const categoryId = input.linkedAccountId == null ? null : await categoryForKind(db, input.kind === 'borrowed' ? 'income' : 'expense');
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO debts
        (person_name, kind, amount, occurred_at, due_date, note, is_settled, linked_account_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
      input.personName,
      input.kind,
      input.amount,
      input.occurredAt,
      input.dueDate,
      input.note,
      input.linkedAccountId,
      now,
      now,
    );
    if (input.linkedAccountId != null && categoryId != null) {
      await insertMovement(db, {
        kind: input.kind === 'borrowed' ? 'income' : 'expense',
        amount: input.amount,
        accountId: input.linkedAccountId,
        categoryId,
        note: movementNote(input.personName, input.note),
        occurredAt: input.occurredAt,
        now,
      });
    }
  });
}

export async function addPayment(
  db: SQLiteDatabase,
  input: { debtId: number; amount: number; occurredAt: string; note: string | null },
): Promise<void> {
  const debt = (await listDebts(db)).find((row) => row.id === input.debtId);
  if (!debt || debt.isSettled) {
    throw new Error('settled');
  }
  const paid = (await listPayments(db)).filter((row) => row.debtId === debt.id).reduce((sum, row) => sum + row.amount, 0);
  if (input.amount > debtRemaining(debt.amount, [paid])) {
    throw new Error('overpay');
  }

  const now = new Date().toISOString();
  const remaining = debt.amount - paid - input.amount;
  const categoryId =
    debt.linkedAccountId == null ? null : await categoryForKind(db, debt.kind === 'borrowed' ? 'expense' : 'income');

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO debt_payments (debt_id, amount, occurred_at, note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      input.debtId,
      input.amount,
      input.occurredAt,
      input.note,
      now,
      now,
    );
    await db.runAsync(
      'UPDATE debts SET is_settled = ?, updated_at = ? WHERE id = ?',
      remaining === 0 ? 1 : 0,
      now,
      debt.id,
    );
    if (debt.linkedAccountId != null && categoryId != null) {
      await insertMovement(db, {
        kind: debt.kind === 'borrowed' ? 'expense' : 'income',
        amount: input.amount,
        accountId: debt.linkedAccountId,
        categoryId,
        note: movementNote(debt.personName, input.note),
        occurredAt: input.occurredAt,
        now,
      });
    }
  });
}

export async function settleDebt(db: SQLiteDatabase, debtId: number): Promise<void> {
  await db.runAsync('UPDATE debts SET is_settled = 1, updated_at = ? WHERE id = ?', new Date().toISOString(), debtId);
}

export async function deletePayment(db: SQLiteDatabase, paymentId: number, debtId: number): Promise<void> {
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM debt_payments WHERE id = ?', paymentId);
    const debt = await db.getFirstAsync<{ amount: number }>('SELECT amount FROM debts WHERE id = ?', debtId);
    const payments = await db.getAllAsync<{ amount: number }>('SELECT amount FROM debt_payments WHERE debt_id = ?', debtId);
    const remaining = debtRemaining(Number(debt?.amount ?? 0), payments.map((row) => Number(row.amount)));
    await db.runAsync(
      'UPDATE debts SET is_settled = ?, updated_at = ? WHERE id = ?',
      remaining <= 0 ? 1 : 0,
      now,
      debtId,
    );
  });
}

export async function deleteDebt(db: SQLiteDatabase, debtId: number): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM debt_payments WHERE debt_id = ?', debtId);
    await db.runAsync('DELETE FROM debts WHERE id = ?', debtId);
  });
}

async function categoryForKind(db: SQLiteDatabase, kind: 'income' | 'expense'): Promise<number> {
  const named = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM categories WHERE kind = ? AND name = ? ORDER BY id LIMIT 1',
    kind,
    'অন্যান্য',
  );
  if (named) {
    return Number(named.id);
  }
  const fallback = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM categories WHERE kind = ? ORDER BY sort_order, id LIMIT 1',
    kind,
  );
  if (!fallback) {
    throw new Error('category');
  }
  return Number(fallback.id);
}

function movementNote(personName: string, note: string | null): string {
  const extra = note?.trim();
  return extra ? `${personName} · ${extra}` : personName;
}

async function insertMovement(
  db: SQLiteDatabase,
  input: {
    kind: TransactionKind;
    amount: number;
    accountId: number;
    categoryId: number;
    note: string;
    occurredAt: string;
    now: string;
  },
): Promise<void> {
  await db.runAsync(
    `INSERT INTO transactions
      (kind, amount, account_id, to_account_id, category_id, note, occurred_at, recurring_rule_id, created_at, updated_at)
     VALUES (?, ?, ?, NULL, ?, ?, ?, NULL, ?, ?)`,
    input.kind,
    input.amount,
    input.accountId,
    input.categoryId,
    input.note,
    input.occurredAt,
    input.now,
    input.now,
  );
}
