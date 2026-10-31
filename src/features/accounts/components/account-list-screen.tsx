import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { EmptyScreen } from '@/components/empty-screen';
import { FormMessage, PrimaryButton } from '@/components/form';
import { MoneyText } from '@/components/money-text';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { copy } from '@/constants/copy';
import { Spacing } from '@/constants/theme';
import { accountBalance } from '@/features/transactions/domain/ledger';
import { useLedger } from '@/features/transactions/data/use-ledger';

export function AccountListScreen() {
  const ledger = useLedger();

  if (ledger.loading) {
    return <EmptyScreen title={copy.accountsTitle} message={copy.loading} />;
  }

  if (ledger.error) {
    return (
      <Screen>
        <FormMessage message={ledger.error} />
        <PrimaryButton label={copy.retry} onPress={ledger.retry} />
      </Screen>
    );
  }

  const active = ledger.accounts.filter((account) => !account.isArchived);
  const archived = ledger.accounts.filter((account) => account.isArchived);

  return (
    <Screen>
      <PrimaryButton label={copy.newAccount} onPress={() => router.push({ pathname: '/accounts/new' })} />
      {ledger.accounts.length === 0 ? <ThemedText themeColor="textSecondary">{copy.noAccounts}</ThemedText> : null}
      <AccountSection title={copy.active} accounts={active} transactions={ledger.transactions} />
      <AccountSection title={copy.archived} accounts={archived} transactions={ledger.transactions} />
    </Screen>
  );
}

function AccountSection({
  title,
  accounts,
  transactions,
}: {
  title: string;
  accounts: ReturnType<typeof useLedger>['accounts'];
  transactions: ReturnType<typeof useLedger>['transactions'];
}) {
  if (accounts.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {title}
      </ThemedText>
      {accounts.map((account) => (
        <Pressable
          key={account.id}
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/accounts/[id]', params: { id: String(account.id) } })}>
          <ThemedView type="backgroundElement" style={styles.row}>
            <View style={[styles.dot, { backgroundColor: account.color }]} />
            <View style={styles.text}>
              <ThemedText>{account.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {accountTypeLabel(account.type)}
              </ThemedText>
            </View>
            <MoneyText paisa={accountBalance(account, transactions)} type="smallBold" />
          </ThemedView>
        </Pressable>
      ))}
    </View>
  );
}

function accountTypeLabel(type: string): string {
  if (type === 'cash') return copy.cash;
  if (type === 'bank') return copy.bank;
  if (type === 'mobile_wallet') return copy.mobileWallet;
  return copy.other;
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  row: {
    borderRadius: 14,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  text: {
    flex: 1,
    gap: Spacing.half,
  },
});
