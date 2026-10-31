import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { View } from 'react-native';

import { EmptyScreen } from '@/components/empty-screen';
import { DayStepper } from '@/components/day-stepper';
import { Chip, ChipRow, FieldLabel, FormMessage, NoteField, PrimaryButton, TextButton, TextField } from '@/components/form';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { copy } from '@/constants/copy';
import type { TransactionKind } from '@/db/types';
import type { AccountRecord } from '@/features/accounts/domain/types';
import type { CategoryRecord } from '@/features/categories/domain/types';
import {
  deleteTransaction,
  saveTransaction,
  type TransactionInput,
} from '@/features/transactions/data/transactions';
import { useLedger } from '@/features/transactions/data/use-ledger';
import type { TransactionRecord } from '@/features/transactions/domain/types';
import { stageDeletedTransaction } from '@/features/transactions/domain/undo';
import { dhakaDateToIso, dhakaDayKey, todayDhakaDayKey } from '@/utils/date';
import { paisaToInput, parseAmountToPaisa } from '@/utils/money';
import { leaveScreen } from '@/utils/navigation';

type Draft = {
  kind: TransactionKind;
  amountText: string;
  accountId: number | null;
  toAccountId: number | null;
  categoryId: number | null;
  dayKey: string;
  note: string;
};

export function TransactionFormScreen({ transactionId }: { transactionId: number | null }) {
  const ledger = useLedger();

  if (ledger.loading) {
    return <EmptyScreen title={copy.newEntry} message={copy.loading} />;
  }

  if (ledger.error) {
    return (
      <Screen>
        <FormMessage message={ledger.error} />
        <PrimaryButton label={copy.retry} onPress={ledger.retry} />
      </Screen>
    );
  }

  const existing =
    transactionId == null
      ? null
      : (ledger.transactions.find((transaction) => transaction.id === transactionId) ?? null);

  if (transactionId != null && !existing) {
    return <EmptyScreen title={copy.editEntry} message={copy.notFound} />;
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

  return (
    <TransactionEditor
      existing={existing}
      accounts={ledger.accounts}
      categories={ledger.categories}
    />
  );
}

function TransactionEditor({
  existing,
  accounts,
  categories,
}: {
  existing: TransactionRecord | null;
  accounts: AccountRecord[];
  categories: CategoryRecord[];
}) {
  const db = useSQLiteContext();
  const [draft, setDraft] = useState<Draft>(() =>
    existing ? draftFrom(existing) : createDraft(accounts, categories),
  );
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
      categoryId:
        kind === 'transfer' ? null : categories.find((category) => category.kind === kind)?.id ?? null,
      toAccountId:
        kind === 'transfer'
          ? (accounts.find((account) => !account.isArchived && account.id !== current.accountId)?.id ?? null)
          : null,
    }));
    setMessage(null);
  }

  async function save() {
    const parsed = parseDraft(draft, existing?.id);
    if ('error' in parsed) {
      setMessage(parsed.error);
      return;
    }

    setSaving(true);
    try {
      await saveTransaction(db, parsed.input);
      leaveScreen();
    } catch {
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
      await deleteTransaction(db, existing.id);
      stageDeletedTransaction(existing);
      leaveScreen();
    } catch {
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
        label={copy.date}
        value={draft.dayKey}
        onChange={(dayKey) => setDraft((current) => ({ ...current, dayKey: dayKey ?? current.dayKey }))}
      />
      <NoteField
        label={copy.note}
        value={draft.note}
        onChangeText={(note) => setDraft((current) => ({ ...current, note }))}
      />
      <FormMessage message={message} />
      <PrimaryButton label={copy.save} onPress={() => void save()} disabled={saving} />
      {existing && !confirming ? (
        <TextButton label={copy.delete} onPress={() => setConfirming(true)} />
      ) : null}
      {existing && confirming ? (
        <View>
          <ThemedText>{copy.deletePrompt}</ThemedText>
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
    dayKey: todayDhakaDayKey(),
    note: '',
  };
}

function draftFrom(transaction: TransactionRecord): Draft {
  return {
    kind: transaction.kind,
    amountText: paisaToInput(transaction.amount),
    accountId: transaction.accountId,
    toAccountId: transaction.toAccountId,
    categoryId: transaction.categoryId,
    dayKey: dhakaDayKey(transaction.occurredAt),
    note: transaction.note ?? '',
  };
}

function parseDraft(draft: Draft, id?: number): { error: string } | { input: TransactionInput } {
  const amount = parseAmountToPaisa(draft.amountText);
  if (amount == null) {
    return { error: copy.requiredAmount };
  }
  if (draft.accountId == null) {
    return { error: copy.requiredAccount };
  }
  if (draft.kind === 'transfer') {
    if (draft.toAccountId == null) {
      return { error: copy.requiredAccount };
    }
    if (draft.toAccountId === draft.accountId) {
      return { error: copy.sameAccount };
    }
  } else if (draft.categoryId == null) {
    return { error: copy.requiredCategory };
  }

  const [year, month, day] = draft.dayKey.split('-').map(Number);
  return {
    input: {
      id,
      kind: draft.kind,
      amount,
      accountId: draft.accountId,
      toAccountId: draft.kind === 'transfer' ? draft.toAccountId : null,
      categoryId: draft.kind === 'transfer' ? null : draft.categoryId,
      note: draft.note.trim() || null,
      occurredAt: dhakaDateToIso(year, month, day),
    },
  };
}
