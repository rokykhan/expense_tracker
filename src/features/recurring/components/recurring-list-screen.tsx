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
import { listRecurringRules } from '@/features/recurring/data/rules';
import type { RecurringRuleRecord } from '@/features/recurring/domain/types';
import { useLedger } from '@/features/transactions/data/use-ledger';
import { useDbQuery } from '@/hooks/use-db-query';
import { useSettings } from '@/providers/settings-provider';
import { dhakaDateToIso, formatDateDhaka } from '@/utils/date';
import { toBanglaDigits } from '@/utils/bangla-digits';

const EMPTY: RecurringRuleRecord[] = [];

export function RecurringListScreen() {
  const rules = useDbQuery(listRecurringRules, EMPTY);
  const ledger = useLedger();
  const { banglaDigits } = useSettings();

  if (rules.loading || ledger.loading) {
    return <EmptyScreen title={copy.recurringTitle} message={copy.loading} />;
  }

  if (rules.error || ledger.error) {
    return (
      <Screen>
        <FormMessage message={rules.error ?? ledger.error} />
        <PrimaryButton label={copy.retry} onPress={rules.error ? rules.retry : ledger.retry} />
      </Screen>
    );
  }

  return (
    <Screen>
      <PrimaryButton label={copy.newRecurring} onPress={() => router.push({ pathname: '/recurring/new' })} />
      {rules.data.length === 0 ? <ThemedText themeColor="textSecondary">{copy.recurringEmpty}</ThemedText> : null}
      {rules.data.map((rule) => {
        const [year, month, day] = rule.nextRunDate.split('-').map(Number);
        const count = banglaDigits ? toBanglaDigits(String(rule.interval)) : String(rule.interval);
        const when = formatDateDhaka(dhakaDateToIso(year, month, day), banglaDigits);
        return (
          <Pressable
            key={rule.id}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/recurring/[id]', params: { id: String(rule.id) } })}>
            <ThemedView type="backgroundElement" style={styles.row}>
              <View style={styles.text}>
                <ThemedText>{ruleLabel(rule, ledger.categories)}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {`প্রতি ${count} ${copy.frequency[rule.frequency]} · ${when}`}
                  {rule.isActive ? '' : ` · ${copy.inactive}`}
                </ThemedText>
              </View>
              <MoneyText paisa={rule.amount} />
            </ThemedView>
          </Pressable>
        );
      })}
    </Screen>
  );
}

function ruleLabel(
  rule: RecurringRuleRecord,
  categories: ReturnType<typeof useLedger>['categories'],
): string {
  if (rule.note) {
    return rule.note;
  }
  if (rule.kind === 'transfer') {
    return copy.transfer;
  }
  return categories.find((category) => category.id === rule.categoryId)?.name ?? copy.unknown;
}

const styles = StyleSheet.create({
  row: {
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  text: {
    flex: 1,
    gap: Spacing.one,
  },
});
