import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { View } from 'react-native';

import { DayStepper } from '@/components/day-stepper';
import { EmptyScreen } from '@/components/empty-screen';
import { Chip, ChipRow, FieldLabel, FormMessage, NoteField, PrimaryButton, TextButton, TextField } from '@/components/form';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { copy } from '@/constants/copy';
import type { RecurringFrequency, TransactionKind } from '@/db/types';
import type { AccountRecord } from '@/features/accounts/domain/types';
import type { CategoryRecord } from '@/features/categories/domain/types';
import { deleteRecurringRule, listRecurringRules, saveRecurringRule } from '@/features/recurring/data/rules';
import type { RecurringRuleRecord } from '@/features/recurring/domain/types';
import { useLedger } from '@/features/transactions/data/use-ledger';
import { useDbQuery } from '@/hooks/use-db-query';
import { todayDhakaDayKey } from '@/utils/date';
import { fromBanglaDigits } from '@/utils/bangla-digits';
import { paisaToInput, parseAmountToPaisa } from '@/utils/money';
import { leaveScreen } from '@/utils/navigation';

const EMPTY: RecurringRuleRecord[] = [];
const FREQUENCIES: RecurringFrequency[] = ['daily', 'weekly', 'monthly', 'yearly'];

type Draft = {
  kind: TransactionKind;
  amountText: string;
  accountId: number | null;
  toAccountId: number | null;
  categoryId: number | null;
  note: string;
  frequency: RecurringFrequency;
  intervalText: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
};

export function RecurringFormScreen({ ruleId }: { ruleId: number | null }) {
  const ledger = useLedger();
  const rules = useDbQuery(listRecurringRules, EMPTY);

  if (ledger.loading || rules.loading) {
    return <EmptyScreen title={copy.recurringTitle} message={copy.loading} />;
  }

  if (ledger.error || rules.error) {
    return (
      <Screen>
        <FormMessage message={ledger.error ?? rules.error} />
        <PrimaryButton label={copy.retry} onPress={ledger.error ? ledger.retry : rules.retry} />
      </Screen>
    );
  }

  const existing = ruleId == null ? null : (rules.data.find((rule) => rule.id === ruleId) ?? null);
  if (ruleId != null && !existing) {
    return <EmptyScreen title={copy.editRecurring} message={copy.notFound} />;
  }

  const active = ledger.accounts.some((account) => !account.isArchived);
  if (!existing && !active) {
    return (
      <Screen>
        <ThemedText>{copy.noActiveAccount}</ThemedText>
        <PrimaryButton label={copy.newAccount} onPress={() => router.push({ pathname: '/accounts/new' })} />
      </Screen>
    );
  }

  return <RecurringEditor existing={existing} accounts={ledger.accounts} categories={ledger.categories} />;
}

function RecurringEditor({
  existing,
  accounts,
  categories,
}: {
  existing: RecurringRuleRecord | null;
  accounts: AccountRecord[];
  categories: CategoryRecord[];
}) {
  const db = useSQLiteContext();
  const [draft, setDraft] = useState<Draft>(() => (existing ? draftFrom(existing) : createDraft(accounts, categories)));
  const [message, setMessage] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  const accountChoices = accounts.filter((account) => !account.isArchived || account.id === draft.accountId);
  const destinationChoices = accounts.filter(
    (account) => !account.isArchived || account.id === draft.toAccountId,
  );
  const categoryChoices = categories.filter((category) => category.kind === draft.kind);

  function changeKind(kind: TransactionKind) {
    setDraft((current) => ({
      ...current,
      kind,
      categoryId: kind === 'transfer' ? null : (categories.find((category) => category.kind === kind)?.id ?? null),
      toAccountId:
        kind === 'transfer'
          ? (accounts.find((account) => !account.isArchived && account.id !== current.accountId)?.id ?? null)
          : null,
    }));
  }

  async function save() {
    const amount = parseAmountToPaisa(draft.amountText);
    const interval = parseInterval(draft.intervalText);
    if (amount == null) {
      setMessage(copy.requiredAmount);
      return;
    }
    if (interval == null) {
      setMessage(copy.requiredInterval);
      return;
    }
    if (draft.accountId == null) {
      setMessage(copy.requiredAccount);
      return;
    }
    if (draft.kind === 'transfer') {
      if (draft.toAccountId == null) {
        setMessage(copy.requiredAccount);
        return;
      }
      if (draft.toAccountId === draft.accountId) {
        setMessage(copy.sameAccount);
        return;
      }
    } else if (draft.categoryId == null) {
      setMessage(copy.requiredCategory);
      return;
    }
    if (draft.endDate && draft.endDate < draft.startDate) {
      setMessage(copy.endBeforeStart);
      return;
    }

    setSaving(true);
    try {
      await saveRecurringRule(db, {
        id: existing?.id,
        kind: draft.kind,
        amount,
        accountId: draft.accountId,
        toAccountId: draft.kind === 'transfer' ? draft.toAccountId : null,
        categoryId: draft.kind === 'transfer' ? null : draft.categoryId,
        note: draft.note.trim().slice(0, 200) || null,
        frequency: draft.frequency,
        interval,
        startDate: draft.startDate,
        endDate: draft.endDate,
        isActive: draft.isActive,
      });
      leaveScreen();
    } catch (saveError) {
      console.error(saveError);
      setMessage(copy.dbError);
      setSaving(false);
    }
  }

  async function remove() {
    if (!existing) {
      return;
    }
    setSaving(true);
    try {
      await deleteRecurringRule(db, existing.id);
      leaveScreen();
    } catch (deleteError) {
      console.error(deleteError);
      setMessage(copy.dbError);
      setSaving(false);
    }
  }

  return (
    <Screen>
      <View>
        <FieldLabel label={copy.kind} />
        <ChipRow>
          <Chip label={copy.expense} selected={draft.kind === 'expense'} onPress={() => changeKind('expense')} />
          <Chip label={copy.income} selected={draft.kind === 'income'} onPress={() => changeKind('income')} />
          <Chip label={copy.transfer} selected={draft.kind === 'transfer'} onPress={() => changeKind('transfer')} />
        </ChipRow>
      </View>
      <TextField
        label={copy.amount}
        value={draft.amountText}
        onChangeText={(amountText) => setDraft((current) => ({ ...current, amountText }))}
        placeholder="0.00"
        keyboard="decimal-pad"
      />
      <View>
        <FieldLabel label={copy.repeat} />
        <ChipRow>
          {FREQUENCIES.map((frequency) => (
            <Chip
              key={frequency}
              label={copy.frequency[frequency]}
              selected={draft.frequency === frequency}
              onPress={() => setDraft((current) => ({ ...current, frequency }))}
            />
          ))}
        </ChipRow>
      </View>
      <TextField
        label={copy.every}
        value={draft.intervalText}
        onChangeText={(intervalText) => setDraft((current) => ({ ...current, intervalText }))}
        keyboard="decimal-pad"
      />
      <View>
        <FieldLabel label={copy.account} />
        <ChipRow>
          {accountChoices.map((account) => (
            <Chip
              key={account.id}
              label={account.name}
              selected={draft.accountId === account.id}
              onPress={() => setDraft((current) => ({ ...current, accountId: account.id }))}
            />
          ))}
        </ChipRow>
      </View>
      {draft.kind === 'transfer' ? (
        <View>
          <FieldLabel label={copy.toAccount} />
          <ChipRow>
            {destinationChoices.map((account) => (
              <Chip
                key={account.id}
                label={account.name}
                selected={draft.toAccountId === account.id}
                onPress={() => setDraft((current) => ({ ...current, toAccountId: account.id }))}
              />
            ))}
          </ChipRow>
        </View>
      ) : (
        <View>
          <FieldLabel label={copy.category} />
          <ChipRow>
            {categoryChoices.map((category) => (
              <Chip
                key={category.id}
                label={category.name}
                selected={draft.categoryId === category.id}
                onPress={() => setDraft((current) => ({ ...current, categoryId: category.id }))}
              />
            ))}
          </ChipRow>
        </View>
      )}
      <DayStepper
        label={copy.startDate}
        value={draft.startDate}
        onChange={(startDate) => setDraft((current) => ({ ...current, startDate: startDate ?? current.startDate }))}
      />
      <DayStepper
        label={copy.endDate}
        value={draft.endDate}
        optional
        onChange={(endDate) => setDraft((current) => ({ ...current, endDate }))}
      />
      {existing ? (
        <Chip
          label={copy.active}
          selected={draft.isActive}
          onPress={() => setDraft((current) => ({ ...current, isActive: !current.isActive }))}
        />
      ) : null}
      <NoteField
        label={copy.note}
        value={draft.note}
        onChangeText={(note) => setDraft((current) => ({ ...current, note }))}
      />
      <FormMessage message={message} />
      <PrimaryButton label={copy.save} onPress={() => void save()} disabled={saving} />
      {existing && !confirming ? <TextButton label={copy.delete} onPress={() => setConfirming(true)} /> : null}
      {existing && confirming ? (
        <View>
          <ThemedText>{copy.deleteRulePrompt}</ThemedText>
          <PrimaryButton label={copy.confirm} onPress={() => void remove()} disabled={saving} />
          <TextButton label={copy.cancel} onPress={() => setConfirming(false)} />
        </View>
      ) : null}
    </Screen>
  );
}

function createDraft(accounts: AccountRecord[], categories: CategoryRecord[]): Draft {
  return {
    kind: 'expense',
    amountText: '',
    accountId: accounts.find((account) => !account.isArchived)?.id ?? null,
    toAccountId: null,
    categoryId: categories.find((category) => category.kind === 'expense')?.id ?? null,
    note: '',
    frequency: 'monthly',
    intervalText: '1',
    startDate: todayDhakaDayKey(),
    endDate: null,
    isActive: true,
  };
}

function draftFrom(rule: RecurringRuleRecord): Draft {
  return {
    kind: rule.kind,
    amountText: paisaToInput(rule.amount),
    accountId: rule.accountId,
    toAccountId: rule.toAccountId,
    categoryId: rule.categoryId,
    note: rule.note ?? '',
    frequency: rule.frequency,
    intervalText: String(rule.interval),
    startDate: rule.startDate,
    endDate: rule.endDate,
    isActive: rule.isActive,
  };
}

function parseInterval(text: string): number | null {
  const digits = fromBanglaDigits(text).trim();
  if (!/^[1-9]\d{0,2}$/.test(digits)) {
    return null;
  }
  return Number(digits);
}
