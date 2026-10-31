import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { View } from 'react-native';

import { DayStepper } from '@/components/day-stepper';
import { EmptyScreen } from '@/components/empty-screen';
import { Chip, ChipRow, FieldLabel, FormMessage, NoteField, PrimaryButton, TextField } from '@/components/form';
import { Screen } from '@/components/screen';
import { copy } from '@/constants/copy';
import type { DebtKind } from '@/db/types';
import { listDebts, saveDebt } from '@/features/debts/data/debts';
import type { DebtRecord } from '@/features/debts/data/debts';
import type { AccountRecord } from '@/features/accounts/domain/types';
import { useLedger } from '@/features/transactions/data/use-ledger';
import { useDbQuery } from '@/hooks/use-db-query';
import { dhakaDateToIso, dhakaDayKey, todayDhakaDayKey } from '@/utils/date';
import { paisaToInput, parseAmountToPaisa } from '@/utils/money';
import { leaveScreen } from '@/utils/navigation';

const EMPTY: DebtRecord[] = [];

export function DebtFormScreen({ debtId }: { debtId: number | null }) {
  const debts = useDbQuery(listDebts, EMPTY);
  const ledger = useLedger();

  if (debts.loading || ledger.loading) {
    return <EmptyScreen title={copy.debtsTitle} message={copy.loading} />;
  }

  if (debts.error || ledger.error) {
    return (
      <Screen>
        <FormMessage message={debts.error ?? ledger.error} />
        <PrimaryButton label={copy.retry} onPress={debts.error ? debts.retry : ledger.retry} />
      </Screen>
    );
  }

  const existing = debtId == null ? null : (debts.data.find((debt) => debt.id === debtId) ?? null);
  if (debtId != null && !existing) {
    return <EmptyScreen title={copy.editDebt} message={copy.notFound} />;
  }

  return <DebtEditor existing={existing} accounts={ledger.accounts} />;
}

function DebtEditor({ existing, accounts }: { existing: DebtRecord | null; accounts: AccountRecord[] }) {
  const db = useSQLiteContext();
  const [personName, setPersonName] = useState(existing?.personName ?? '');
  const [kind, setKind] = useState<DebtKind>(existing?.kind ?? 'borrowed');
  const [amountText, setAmountText] = useState(existing ? paisaToInput(existing.amount) : '');
  const [dayKey, setDayKey] = useState(existing ? dhakaDayKey(existing.occurredAt) : todayDhakaDayKey());
  const [dueDate, setDueDate] = useState<string | null>(existing?.dueDate ?? null);
  const [note, setNote] = useState(existing?.note ?? '');
  const [linked, setLinked] = useState(existing?.linkedAccountId != null);
  const [accountId, setAccountId] = useState<number | null>(
    existing?.linkedAccountId ?? accounts.find((account) => !account.isArchived)?.id ?? null,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const choices = accounts.filter((account) => !account.isArchived || account.id === accountId);

  async function save() {
    const name = personName.trim().slice(0, 40);
    const amount = parseAmountToPaisa(amountText);
    if (!name) {
      setMessage(copy.requiredName);
      return;
    }
    if (amount == null) {
      setMessage(copy.requiredAmount);
      return;
    }
    if (!existing && linked && accountId == null) {
      setMessage(copy.requiredAccount);
      return;
    }
    if (dueDate && dueDate < dayKey) {
      setMessage(copy.endBeforeStart);
      return;
    }
    const [year, month, day] = dayKey.split('-').map(Number);
    setSaving(true);
    try {
      await saveDebt(db, {
        id: existing?.id,
        personName: name,
        kind,
        amount,
        occurredAt: dhakaDateToIso(year, month, day),
        dueDate,
        note: note.trim().slice(0, 200) || null,
        linkedAccountId: existing ? existing.linkedAccountId : linked ? accountId : null,
      });
      leaveScreen();
    } catch (saveError) {
      console.error(saveError);
      setMessage(saveError instanceof Error && saveError.message === 'category' ? copy.noCategories : copy.dbError);
      setSaving(false);
    }
  }

  return (
    <Screen>
      <TextField label={copy.person} value={personName} onChangeText={setPersonName} />
      <View>
        <FieldLabel label={copy.kind} />
        <ChipRow>
          <Chip label={copy.payable} selected={kind === 'borrowed'} onPress={() => setKind('borrowed')} />
          <Chip label={copy.receivable} selected={kind === 'lent'} onPress={() => setKind('lent')} />
        </ChipRow>
      </View>
      <TextField
        label={copy.amount}
        value={amountText}
        onChangeText={setAmountText}
        placeholder="0.00"
        keyboard="decimal-pad"
      />
      <DayStepper label={copy.date} value={dayKey} onChange={(next) => setDayKey(next ?? dayKey)} />
      <DayStepper label={copy.dueDate} value={dueDate} optional onChange={setDueDate} />
      <NoteField label={copy.note} value={note} onChangeText={setNote} />
      {existing ? null : (
        <View>
          <Chip label={copy.linkAccount} selected={linked} onPress={() => setLinked((value) => !value)} />
          {linked ? (
            <ChipRow>
              {choices.map((account) => (
                <Chip
                  key={account.id}
                  label={account.name}
                  selected={accountId === account.id}
                  onPress={() => setAccountId(account.id)}
                />
              ))}
            </ChipRow>
          ) : null}
        </View>
      )}
      <FormMessage message={message} />
      <PrimaryButton label={copy.save} onPress={() => void save()} disabled={saving} />
    </Screen>
  );
}
