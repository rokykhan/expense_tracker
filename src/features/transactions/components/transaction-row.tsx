import { Pressable, StyleSheet, View } from 'react-native';

import { MoneyText } from '@/components/money-text';
import { ThemedText } from '@/components/themed-text';
import { copy } from '@/constants/copy';
import { Spacing } from '@/constants/theme';
import type { AccountRecord } from '@/features/accounts/domain/types';
import type { CategoryRecord } from '@/features/categories/domain/types';
import type { TransactionRecord } from '@/features/transactions/domain/types';

export function transactionTitle(transaction: TransactionRecord, categories: CategoryRecord[]): string {
  if (transaction.kind === 'transfer') {
    return copy.transfer;
  }
  return categories.find((category) => category.id === transaction.categoryId)?.name ?? copy.unknown;
}

export function transactionSubtitle(transaction: TransactionRecord, accounts: AccountRecord[]): string {
  const from = accounts.find((account) => account.id === transaction.accountId)?.name ?? copy.unknown;
  if (transaction.kind === 'transfer') {
    const to = accounts.find((account) => account.id === transaction.toAccountId)?.name ?? copy.unknown;
    const path = `${from} → ${to}`;
    return transaction.note ? `${path} · ${transaction.note}` : path;
  }
  return transaction.note ? `${from} · ${transaction.note}` : from;
}

export function signedPaisa(transaction: TransactionRecord): number {
  return transaction.kind === 'expense' ? -transaction.amount : transaction.amount;
}

export function TransactionRow({
  transaction,
  accounts,
  categories,
  onPress,
}: {
  transaction: TransactionRecord;
  accounts: AccountRecord[];
  categories: CategoryRecord[];
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
      <View style={styles.text}>
        <ThemedText>{transactionTitle(transaction, categories)}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {transactionSubtitle(transaction, accounts)}
        </ThemedText>
      </View>
      <MoneyText paisa={signedPaisa(transaction)} type="smallBold" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  text: {
    flex: 1,
    gap: Spacing.half,
  },
});
