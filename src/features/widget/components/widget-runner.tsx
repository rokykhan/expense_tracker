import { useEffect } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { router } from 'expo-router';
import { Platform } from 'react-native';

import { buildSummary, todayExpensePaisa, ADD_ENTRY_TARGET, type SummaryProps } from '@/features/widget/domain/summary';
import { listTransactions } from '@/features/transactions/data/transactions';
import { monthTotals } from '@/features/transactions/domain/ledger';
import { currentDhakaMonth, todayDhakaDayKey } from '@/utils/date';
import { useDataGeneration } from '@/providers/refresh-provider';
import { useSettings } from '@/providers/settings-context';

async function publishSummary(props: SummaryProps): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }
  try {
    const widget = await import('@/widgets/summary');
    widget.default.updateSnapshot(props);
  } catch {
    // The home screen widget is available in a development build.
  }
}

export function WidgetRunner() {
  const db = useSQLiteContext();
  const generation = useDataGeneration();
  const { currencySymbol, banglaDigits } = useSettings();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const transactions = await listTransactions(db);
      if (cancelled) {
        return;
      }
      const today = todayDhakaDayKey();
      const month = currentDhakaMonth();
      const totals = monthTotals(transactions, month.year, month.month);
      await publishSummary(
        buildSummary({
          todayExpense: todayExpensePaisa(transactions, today),
          monthNet: totals.savings,
          symbol: currencySymbol,
          banglaDigits,
        }),
      );
    })().catch(() => {
      // A failed snapshot leaves the previous widget text in place.
    });
    return () => {
      cancelled = true;
    };
  }, [banglaDigits, currencySymbol, db, generation]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }
    let remove = () => {};
    let cancelled = false;
    void import('expo-widgets')
      .then(({ addUserInteractionListener }) => {
        if (cancelled) {
          return;
        }
        const subscription = addUserInteractionListener((event) => {
          if (event.target === ADD_ENTRY_TARGET) {
            router.push('/transaction/new');
          }
        });
        remove = () => subscription.remove();
      })
      .catch(() => {
        // Expo Go has no widget process.
      });
    return () => {
      cancelled = true;
      remove();
    };
  }, []);

  return null;
}
