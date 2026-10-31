import { useState } from 'react';

import { EmptyScreen } from '@/components/empty-screen';
import { Chip, ChipRow, FormMessage, PrimaryButton } from '@/components/form';
import { Screen } from '@/components/screen';
import { copy } from '@/constants/copy';
import { CustomReport } from '@/features/reports/components/custom-report';
import { MonthlyReport } from '@/features/reports/components/monthly-report-screen';
import { YearlyReport } from '@/features/reports/components/yearly-report';
import { useLedger } from '@/features/transactions/data/use-ledger';

type ReportView = 'month' | 'year' | 'custom';

export function ReportsScreen() {
  const ledger = useLedger();
  const [view, setView] = useState<ReportView>('month');

  if (ledger.loading) {
    return <EmptyScreen title={copy.tabs.reports} message={copy.loading} />;
  }

  if (ledger.error) {
    return (
      <Screen tabBar>
        <FormMessage message={ledger.error} />
        <PrimaryButton label={copy.retry} onPress={ledger.retry} />
      </Screen>
    );
  }

  return (
    <Screen tabBar>
      <ChipRow>
        <Chip label={copy.reportMonthly} selected={view === 'month'} onPress={() => setView('month')} />
        <Chip label={copy.reportYearly} selected={view === 'year'} onPress={() => setView('year')} />
        <Chip label={copy.reportCustom} selected={view === 'custom'} onPress={() => setView('custom')} />
      </ChipRow>
      {view === 'month' ? (
        <MonthlyReport transactions={ledger.transactions} categories={ledger.categories} />
      ) : null}
      {view === 'year' ? <YearlyReport transactions={ledger.transactions} /> : null}
      {view === 'custom' ? (
        <CustomReport
          transactions={ledger.transactions}
          accounts={ledger.accounts}
          categories={ledger.categories}
        />
      ) : null}
    </Screen>
  );
}
