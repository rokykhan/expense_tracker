import { type Href, router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { DayStepper } from '@/components/day-stepper';
import { EmptyScreen } from '@/components/empty-screen';
import { FormMessage, NoteField, PrimaryButton, TextButton, TextField } from '@/components/form';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { copy } from '@/constants/copy';
import { Spacing } from '@/constants/theme';
import { ReminderDenied, ReminderUnavailable } from '@/features/tasks/data/reminder-client';
import { deviceReminders } from '@/features/tasks/data/reminders';
import { deleteTask, listTasks, saveTask, type TaskRecord } from '@/features/tasks/data/tasks';
import { useDbQuery } from '@/hooks/use-db-query';
import { useSettings } from '@/providers/settings-provider';
import { toBanglaDigits } from '@/utils/bangla-digits';
import { dhakaClock, dhakaDateTimeToIso, dhakaDayKey } from '@/utils/date';
import { leaveScreen } from '@/utils/navigation';

const NO_TASKS: TaskRecord[] = [];

function pad(value: number, banglaDigits: boolean): string {
  const text = String(value).padStart(2, '0');
  return banglaDigits ? toBanglaDigits(text) : text;
}

export function TaskFormScreen({ taskId }: { taskId: number | null }) {
  const tasks = useDbQuery(listTasks, NO_TASKS);

  if (tasks.loading) {
    return <EmptyScreen title={copy.tasksTitle} message={copy.loading} />;
  }

  if (tasks.error) {
    return (
      <Screen>
        <FormMessage message={tasks.error} />
        <PrimaryButton label={copy.retry} onPress={tasks.retry} />
      </Screen>
    );
  }

  const existing = taskId == null ? null : (tasks.data.find((task) => task.id === taskId) ?? null);
  if (taskId != null && !existing) {
    return <EmptyScreen title={copy.tasksTitle} message={copy.notFound} />;
  }

  return <TaskEditor existing={existing} />;
}

function TaskEditor({ existing }: { existing: TaskRecord | null }) {
  const db = useSQLiteContext();
  const { banglaDigits } = useSettings();
  const clock = existing?.remindAt ? dhakaClock(existing.remindAt) : null;
  const [title, setTitle] = useState(existing?.title ?? '');
  const [note, setNote] = useState(existing?.note ?? '');
  const [dueDate, setDueDate] = useState<string | null>(existing?.dueDate ?? null);
  const [remindDay, setRemindDay] = useState<string | null>(
    existing?.remindAt ? dhakaDayKey(existing.remindAt) : null,
  );
  const [hour, setHour] = useState(clock?.hour ?? 9);
  const [minute, setMinute] = useState(clock?.minute ?? 0);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function save() {
    const trimmed = title.trim();
    if (!trimmed) {
      setMessage(copy.requiredName);
      return;
    }
    let remindAt: string | null = null;
    if (remindDay) {
      const [year, month, day] = remindDay.split('-').map(Number);
      remindAt = dhakaDateTimeToIso(year, month, day, hour, minute);
      if (Date.parse(remindAt) <= Date.now()) {
        setMessage(copy.reminderPast);
        return;
      }
    }
    setSaving(true);
    setMessage(null);
    try {
      await saveTask(
        db,
        {
          id: existing?.id,
          title: trimmed,
          note: note.trim() || null,
          dueDate,
          remindAt,
          isDone: existing?.isDone ?? false,
        },
        deviceReminders,
      );
      leaveScreen();
    } catch (error) {
      if (error instanceof ReminderDenied) {
        setMessage(copy.reminderDenied);
      } else if (error instanceof ReminderUnavailable) {
        setMessage(copy.reminderPhone);
      } else {
        console.error(error);
        setMessage(copy.dbError);
      }
      setSaving(false);
    }
  }

  async function remove() {
    if (!existing) {
      return;
    }
    setSaving(true);
    try {
      await deleteTask(db, existing.id, deviceReminders);
      router.dismissTo('/tasks' as Href);
    } catch (error) {
      console.error(error);
      setMessage(copy.dbError);
      setSaving(false);
    }
  }

  return (
    <Screen>
      <TextField label={copy.name} value={title} onChangeText={setTitle} />
      <NoteField label={copy.note} value={note} onChangeText={setNote} />
      <DayStepper label={copy.taskDue} value={dueDate} onChange={setDueDate} optional />
      <DayStepper label={copy.reminder} value={remindDay} onChange={setRemindDay} optional />
      {remindDay ? (
        <View style={styles.clock}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            {copy.reminderTime}
          </ThemedText>
          <View style={styles.row}>
            <Pressable accessibilityRole="button" accessibilityLabel={copy.previousHour} onPress={() => setHour((value) => (value + 23) % 24)}>
              <ThemedText>{copy.previousHour}</ThemedText>
            </Pressable>
            <ThemedText type="smallBold">{pad(hour, banglaDigits)}</ThemedText>
            <Pressable accessibilityRole="button" accessibilityLabel={copy.nextHour} onPress={() => setHour((value) => (value + 1) % 24)}>
              <ThemedText>{copy.nextHour}</ThemedText>
            </Pressable>
          </View>
          <View style={styles.row}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.previousMinute}
              onPress={() => setMinute((value) => (value + 45) % 60)}>
              <ThemedText>{copy.previousMinute}</ThemedText>
            </Pressable>
            <ThemedText type="smallBold">{pad(minute, banglaDigits)}</ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.nextMinute}
              onPress={() => setMinute((value) => (value + 15) % 60)}>
              <ThemedText>{copy.nextMinute}</ThemedText>
            </Pressable>
          </View>
        </View>
      ) : null}
      <FormMessage message={message} />
      <PrimaryButton label={copy.save} onPress={() => void save()} disabled={saving} />
      {existing && !confirming ? <TextButton label={copy.delete} onPress={() => setConfirming(true)} /> : null}
      {confirming ? (
        <View>
          <ThemedText>{copy.deleteTaskPrompt}</ThemedText>
          <TextButton label={copy.cancel} onPress={() => setConfirming(false)} />
          <TextButton label={copy.confirm} onPress={() => void remove()} />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  clock: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
