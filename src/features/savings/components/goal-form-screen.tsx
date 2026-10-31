import { type Href, router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { View } from 'react-native';

import { DayStepper } from '@/components/day-stepper';
import { EmptyScreen } from '@/components/empty-screen';
import { FormMessage, PrimaryButton, TextButton, TextField } from '@/components/form';
import { Screen } from '@/components/screen';
import { ColorPicker, IconPicker } from '@/components/swatch-picker';
import { ThemedText } from '@/components/themed-text';
import { copy } from '@/constants/copy';
import { COLOR_CHOICES, ICON_CHOICES } from '@/constants/pickers';
import { deleteGoal, listGoals, saveGoal } from '@/features/savings/data/goals';
import type { GoalRecord } from '@/features/savings/data/goals';
import { useDbQuery } from '@/hooks/use-db-query';
import { paisaToInput, parseAmountToPaisa } from '@/utils/money';
import { leaveScreen } from '@/utils/navigation';

const EMPTY: GoalRecord[] = [];

export function GoalFormScreen({ goalId }: { goalId: number | null }) {
  const goals = useDbQuery(listGoals, EMPTY);

  if (goals.loading) {
    return <EmptyScreen title={copy.savingsTitle} message={copy.loading} />;
  }

  if (goals.error) {
    return (
      <Screen>
        <FormMessage message={goals.error} />
        <PrimaryButton label={copy.retry} onPress={goals.retry} />
      </Screen>
    );
  }

  const existing = goalId == null ? null : (goals.data.find((goal) => goal.id === goalId) ?? null);
  if (goalId != null && !existing) {
    return <EmptyScreen title={copy.editGoal} message={copy.notFound} />;
  }

  return <GoalEditor existing={existing} />;
}

function GoalEditor({ existing }: { existing: GoalRecord | null }) {
  const db = useSQLiteContext();
  const [name, setName] = useState(existing?.name ?? '');
  const [amountText, setAmountText] = useState(existing ? paisaToInput(existing.targetAmount) : '');
  const [deadline, setDeadline] = useState<string | null>(existing?.deadline ?? null);
  const [icon, setIcon] = useState(existing?.icon ?? ICON_CHOICES[3].name);
  const [color, setColor] = useState(existing?.color ?? COLOR_CHOICES[3]);
  const [message, setMessage] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    const trimmed = name.trim().slice(0, 40);
    const targetAmount = parseAmountToPaisa(amountText);
    if (!trimmed) {
      setMessage(copy.requiredName);
      return;
    }
    if (targetAmount == null) {
      setMessage(copy.requiredAmount);
      return;
    }
    setSaving(true);
    try {
      await saveGoal(db, { id: existing?.id, name: trimmed, targetAmount, deadline, icon, color });
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
      await deleteGoal(db, existing.id);
      router.dismissTo('/savings' as Href);
    } catch (deleteError) {
      console.error(deleteError);
      setMessage(copy.dbError);
      setSaving(false);
    }
  }

  return (
    <Screen>
      <TextField label={copy.name} value={name} onChangeText={setName} />
      <TextField
        label={copy.target}
        value={amountText}
        onChangeText={setAmountText}
        placeholder="0.00"
        keyboard="decimal-pad"
      />
      <DayStepper label={copy.deadline} value={deadline} optional onChange={setDeadline} />
      <IconPicker value={icon} onChange={setIcon} />
      <ColorPicker value={color} onChange={setColor} />
      <FormMessage message={message} />
      <PrimaryButton label={copy.save} onPress={() => void save()} disabled={saving} />
      {existing && !confirming ? <TextButton label={copy.delete} onPress={() => setConfirming(true)} /> : null}
      {existing && confirming ? (
        <View>
          <ThemedText>{copy.deleteGoalPrompt}</ThemedText>
          <PrimaryButton label={copy.confirm} onPress={() => void remove()} disabled={saving} />
          <TextButton label={copy.cancel} onPress={() => setConfirming(false)} />
        </View>
      ) : null}
    </Screen>
  );
}
