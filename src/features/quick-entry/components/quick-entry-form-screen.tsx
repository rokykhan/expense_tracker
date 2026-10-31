import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { View } from 'react-native';

import { EmptyScreen } from '@/components/empty-screen';
import { Chip, ChipRow, FieldLabel, FormMessage, NoteField, PrimaryButton, TextButton, TextField } from '@/components/form';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { copy } from '@/constants/copy';
import { deleteQuickEntry, listQuickEntries, saveQuickEntry } from '@/features/quick-entry/data/quick-entries';
import type { QuickEntryRecord } from '@/features/quick-entry/domain/types';
import type { AccountRecord } from '@/features/accounts/domain/types';
import type { CategoryRecord } from '@/features/categories/domain/types';
import { useLedger } from '@/features/transactions/data/use-ledger';
import { useDbQuery } from '@/hooks/use-db-query';
import { paisaToInput, parseAmountToPaisa } from '@/utils/money';
import { leaveScreen } from '@/utils/navigation';

const EMPTY: QuickEntryRecord[] = [];

type Draft = {
  title: string;
  kind: 'income' | 'expense';
  amountText: string;
  accountId: number | null;
  categoryId: number | null;
  note: string;
};

export function QuickEntryFormScreen({ entryId }: { entryId: number | null }) {
  const ledger = useLedger();
  const entries = useDbQuery(listQuickEntries, EMPTY);

  if (ledger.loading || entries.loading) {
    return <EmptyScreen title={copy.quickEntries} message={copy.loading} />;
  }

  if (ledger.error || entries.error) {
    return (
      <Screen>
        <FormMessage message={ledger.error ?? entries.error} />
        <PrimaryButton label={copy.retry} onPress={ledger.error ? ledger.retry : entries.retry} />
      </Screen>
    );
  }

  const existing = entryId == null ? null : (entries.data.find((entry) => entry.id === entryId) ?? null);
  if (entryId != null && !existing) {
    return <EmptyScreen title={copy.editQuickEntry} message={copy.notFound} />;
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

  return <QuickEntryEditor existing={existing} accounts={ledger.accounts} categories={ledger.categories} />;
}

function QuickEntryEditor({
  existing,
  accounts,
  categories,
}: {
  existing: QuickEntryRecord | null;
  accounts: AccountRecord[];
  categories: CategoryRecord[];
}) {
  const db = useSQLiteContext();
  const [draft, setDraft] = useState<Draft>(() =>
    existing
      ? {
          title: existing.title,
          kind: existing.kind === 'income' ? 'income' : 'expense',
          amountText: paisaToInput(existing.amount),
          accountId: existing.accountId,
          categoryId: existing.categoryId,
          note: existing.note ?? '',
        }
      : {
          title: '',
          kind: 'expense',
          amountText: '',
          accountId: accounts.find((account) => !account.isArchived)?.id ?? null,
          categoryId: categories.find((category) => category.kind === 'expense')?.id ?? null,
          note: '',
        },
  );
  const [message, setMessage] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  const accountChoices = accounts.filter((account) => !account.isArchived || account.id === draft.accountId);
  const categoryChoices = categories.filter((category) => category.kind === draft.kind);

  function changeKind(kind: 'income' | 'expense') {
    setDraft((current) => ({
      ...current,
      kind,
      categoryId: categories.find((category) => category.kind === kind)?.id ?? null,
    }));
  }

  async function save() {
    const title = draft.title.trim().slice(0, 40);
    const amount = parseAmountToPaisa(draft.amountText);
    if (!title) {
      setMessage(copy.requiredName);
      return;
    }
    if (amount == null) {
      setMessage(copy.requiredAmount);
      return;
    }
    if (draft.accountId == null) {
      setMessage(copy.requiredAccount);
      return;
    }
    if (draft.categoryId == null) {
      setMessage(copy.requiredCategory);
      return;
    }

    setSaving(true);
    try {
      await saveQuickEntry(db, {
        id: existing?.id,
        title,
        kind: draft.kind,
        amount,
        accountId: draft.accountId,
        categoryId: draft.categoryId,
        note: draft.note.trim().slice(0, 200) || null,
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
      await deleteQuickEntry(db, existing.id);
      leaveScreen();
    } catch (deleteError) {
      console.error(deleteError);
      setMessage(copy.dbError);
      setSaving(false);
    }
  }

  return (
    <Screen>
      <TextField
        label={copy.name}
        value={draft.title}
        onChangeText={(title) => setDraft((current) => ({ ...current, title }))}
      />
      <View>
        <FieldLabel label={copy.kind} />
        <ChipRow>
          <Chip label={copy.expense} selected={draft.kind === 'expense'} onPress={() => changeKind('expense')} />
          <Chip label={copy.income} selected={draft.kind === 'income'} onPress={() => changeKind('income')} />
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
          <ThemedText>{copy.deleteQuickPrompt}</ThemedText>
          <PrimaryButton label={copy.confirm} onPress={() => void remove()} disabled={saving} />
          <TextButton label={copy.cancel} onPress={() => setConfirming(false)} />
        </View>
      ) : null}
    </Screen>
  );
}
