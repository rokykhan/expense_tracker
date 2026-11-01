import { dhakaDayKey } from '@/utils/date';
import { formatMoney } from '@/utils/money';

export const ADD_ENTRY_TARGET = 'add';
export const ADD_ENTRY_URL = 'hisabkhata://transaction/new';

export type SummaryProps = {
  todayLabel: string;
  todayValue: string;
  monthLabel: string;
  monthValue: string;
  addLabel: string;
};

type ExpenseRow = {
  kind: string;
  amount: number;
  occurredAt: string;
};

export function todayExpensePaisa(transactions: ExpenseRow[], today: string): number {
  return transactions.reduce((sum, transaction) => {
    if (transaction.kind !== 'expense' || dhakaDayKey(transaction.occurredAt) !== today) {
      return sum;
    }
    return sum + transaction.amount;
  }, 0);
}

export function buildSummary(input: {
  todayExpense: number;
  monthNet: number;
  symbol: string;
  banglaDigits: boolean;
}): SummaryProps {
  return {
    todayLabel: 'আজকের ব্যয়',
    todayValue: formatMoney(-input.todayExpense, input.symbol, input.banglaDigits),
    monthLabel: 'সঞ্চয়',
    monthValue: formatMoney(input.monthNet, input.symbol, input.banglaDigits),
    addLabel: 'নতুন এন্ট্রি',
  };
}
