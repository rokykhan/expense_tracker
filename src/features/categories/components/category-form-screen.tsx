import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { View } from 'react-native';

import { EmptyScreen } from '@/components/empty-screen';
import { Chip, ChipRow, FieldLabel, FormMessage, PrimaryButton, TextButton, TextField } from '@/components/form';
import { Screen } from '@/components/screen';
import { ColorPicker, IconPicker } from '@/components/swatch-picker';
import { ThemedText } from '@/components/themed-text';
import { copy } from '@/constants/copy';
import { COLOR_CHOICES, ICON_CHOICES } from '@/constants/pickers';
import type { CategoryKind } from '@/db/types';
import { categoryUsageCount, deleteCategory, saveCategory } from '@/features/categories/data/categories';
import type { CategoryRecord } from '@/features/categories/domain/types';
import { useLedger } from '@/features/transactions/data/use-ledger';
import { leaveScreen } from '@/utils/navigation';

type Draft = {
  name: string;
  kind: CategoryKind;
  icon: string;
  color: string;
};

export function CategoryFormScreen({ categoryId }: { categoryId: number | null }) {
  const ledger = useLedger();

  if (ledger.loading) {
    return <EmptyScreen title={copy.categoriesTitle} message={copy.loading} />;
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
    categoryId == null ? null : (ledger.categories.find((category) => category.id === categoryId) ?? null);
  if (categoryId != null && !existing) {
    return <EmptyScreen title={copy.editCategory} message={copy.notFound} />;
  }

  return <CategoryEditor existing={existing} />;
}

function CategoryEditor({ existing }: { existing: CategoryRecord | null }) {
  const db = useSQLiteContext();
  const [draft, setDraft] = useState<Draft>(() =>
    existing
      ? { name: existing.name, kind: existing.kind, icon: existing.icon, color: existing.color }
      : { name: '', kind: 'expense', icon: ICON_CHOICES[4].name, color: COLOR_CHOICES[1] },
  );
  const [message, setMessage] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    const name = draft.name.trim();
    if (!name) {
      setMessage(copy.requiredName);
      return;
    }

    setSaving(true);
    try {
      await saveCategory(db, {
        id: existing?.id,
        name,
        kind: draft.kind,
        icon: draft.icon,
        color: draft.color,
      });
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
      const count = await categoryUsageCount(db, existing.id);
      if (count > 0) {
        setMessage(copy.categoryInUse);
        setSaving(false);
        setConfirming(false);
        return;
      }
      await deleteCategory(db, existing.id);
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
      {existing ? (
        <ThemedText themeColor="textSecondary">{existing.kind === 'income' ? copy.income : copy.expense}</ThemedText>
      ) : (
        <View>
          <FieldLabel label={copy.kind} />
          <ChipRow>
            <Chip
              label={copy.expense}
              selected={draft.kind === 'expense'}
              onPress={() => setDraft((current) => ({ ...current, kind: 'expense' }))}
            />
            <Chip
              label={copy.income}
              selected={draft.kind === 'income'}
              onPress={() => setDraft((current) => ({ ...current, kind: 'income' }))}
            />
          </ChipRow>
        </View>
      )}
      <IconPicker value={draft.icon} onChange={(icon) => setDraft((current) => ({ ...current, icon }))} />
      <ColorPicker value={draft.color} onChange={(color) => setDraft((current) => ({ ...current, color }))} />
      <FormMessage message={message} />
      <PrimaryButton label={copy.save} onPress={() => void save()} disabled={saving} />
      {existing && !confirming ? <TextButton label={copy.delete} onPress={() => setConfirming(true)} /> : null}
      {existing && confirming ? (
        <View>
          <ThemedText>{copy.deleteCategoryPrompt}</ThemedText>
          <PrimaryButton label={copy.confirm} onPress={() => void remove()} disabled={saving} />
          <TextButton label={copy.cancel} onPress={() => setConfirming(false)} />
        </View>
      ) : null}
    </Screen>
  );
}
