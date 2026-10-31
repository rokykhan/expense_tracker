import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';

import { EmptyScreen } from '@/components/empty-screen';
import { Chip, ChipRow, FieldLabel, FormMessage, PrimaryButton, TextField } from '@/components/form';
import { Screen } from '@/components/screen';
import { ColorPicker, IconPicker } from '@/components/swatch-picker';
import { copy } from '@/constants/copy';
import { COLOR_CHOICES, ICON_CHOICES } from '@/constants/pickers';
import type { AccountType } from '@/db/types';
import { saveAccount } from '@/features/accounts/data/accounts';
import type { AccountRecord } from '@/features/accounts/domain/types';
import { useLedger } from '@/features/transactions/data/use-ledger';
import { paisaToInput, parseAmountToPaisa } from '@/utils/money';
import { leaveScreen } from '@/utils/navigation';

const TYPES: { type: AccountType; label: string }[] = [
  { type: 'cash', label: copy.cash },
  { type: 'bank', label: copy.bank },
  { type: 'mobile_wallet', label: copy.mobileWallet },
  { type: 'other', label: copy.other },
];

type Draft = {
  name: string;
  type: AccountType;
  balanceText: string;
  icon: string;
  color: string;
  isArchived: boolean;
};

export function AccountFormScreen({ accountId }: { accountId: number | null }) {
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

  const existing =
    accountId == null ? null : (ledger.accounts.find((account) => account.id === accountId) ?? null);
  if (accountId != null && !existing) {
    return <EmptyScreen title={copy.editAccount} message={copy.notFound} />;
  }

  return <AccountEditor existing={existing} />;
}

function AccountEditor({ existing }: { existing: AccountRecord | null }) {
  const db = useSQLiteContext();
  const [draft, setDraft] = useState<Draft>(() =>
    existing
      ? {
          name: existing.name,
          type: existing.type,
          balanceText: paisaToInput(existing.initialBalance),
          icon: existing.icon,
          color: existing.color,
          isArchived: existing.isArchived,
        }
      : {
          name: '',
          type: 'cash',
          balanceText: '',
          icon: ICON_CHOICES[0].name,
          color: COLOR_CHOICES[0],
          isArchived: false,
        },
  );
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    const name = draft.name.trim();
    if (!name) {
      setMessage(copy.requiredName);
      return;
    }
    const initialBalance =
      draft.balanceText.trim() === ''
        ? 0
        : parseAmountToPaisa(draft.balanceText, { allowZero: true });
    if (initialBalance == null) {
      setMessage(copy.requiredAmount);
      return;
    }

    setSaving(true);
    try {
      await saveAccount(db, {
        id: existing?.id,
        name,
        type: draft.type,
        initialBalance,
        icon: draft.icon,
        color: draft.color,
        isArchived: draft.isArchived,
      });
      leaveScreen();
    } catch {
      setMessage(copy.dbError);
      setSaving(false);
    }
  }

  return (
    <Screen>
      <TextField
        label={copy.name}
        value={draft.name}
        onChangeText={(name) => setDraft((current) => ({ ...current, name }))}
      />
      <FieldLabel label={copy.type} />
      <ChipRow>
        {TYPES.map((item) => (
          <Chip
            key={item.type}
            label={item.label}
            selected={draft.type === item.type}
            onPress={() => setDraft((current) => ({ ...current, type: item.type }))}
          />
        ))}
      </ChipRow>
      <TextField
        label={copy.initialBalance}
        value={draft.balanceText}
        onChangeText={(balanceText) => setDraft((current) => ({ ...current, balanceText }))}
        placeholder="0"
        keyboard="decimal-pad"
      />
      <IconPicker value={draft.icon} onChange={(icon) => setDraft((current) => ({ ...current, icon }))} />
      <ColorPicker value={draft.color} onChange={(color) => setDraft((current) => ({ ...current, color }))} />
      {existing ? (
        <Chip
          label={draft.isArchived ? copy.archived : copy.archive}
          selected={draft.isArchived}
          onPress={() => setDraft((current) => ({ ...current, isArchived: !current.isArchived }))}
        />
      ) : null}
      <FormMessage message={message} />
      <PrimaryButton label={copy.save} onPress={() => void save()} disabled={saving} />
    </Screen>
  );
}
