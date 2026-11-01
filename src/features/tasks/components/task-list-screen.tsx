import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { EmptyScreen } from '@/components/empty-screen';
import { Chip, ChipRow, FormMessage, PrimaryButton, TextButton } from '@/components/form';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { copy } from '@/constants/copy';
import { Spacing } from '@/constants/theme';
import { deviceReminders } from '@/features/tasks/data/reminders';
import { listTasks, setTaskDone, type TaskRecord } from '@/features/tasks/data/tasks';
import { tasksForFilter, type TaskFilter } from '@/features/tasks/domain/tasks';
import { useDbQuery } from '@/hooks/use-db-query';
import { useRefresh } from '@/providers/refresh-provider';
import { useSettings } from '@/providers/settings-provider';
import { dhakaClock, dhakaDateToIso, formatDateDhaka, todayDhakaDayKey } from '@/utils/date';
import { toBanglaDigits } from '@/utils/bangla-digits';
import { openPath } from '@/utils/navigation';

const NO_TASKS: TaskRecord[] = [];

function clockText(iso: string, banglaDigits: boolean): string {
  const clock = dhakaClock(iso);
  const text = `${String(clock.hour).padStart(2, '0')}:${String(clock.minute).padStart(2, '0')}`;
  return banglaDigits ? toBanglaDigits(text) : text;
}

export function TaskListScreen() {
  const db = useSQLiteContext();
  const tasks = useDbQuery(listTasks, NO_TASKS);
  const { bump } = useRefresh();
  const { banglaDigits } = useSettings();
  const [filter, setFilter] = useState<TaskFilter>('today');
  const [message, setMessage] = useState<string | null>(null);

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

  const today = todayDhakaDayKey();
  const shown = tasksForFilter(tasks.data, filter, today);

  async function toggle(task: TaskRecord) {
    setMessage(null);
    try {
      await setTaskDone(db, task.id, !task.isDone, deviceReminders);
      bump();
    } catch (error) {
      console.error(error);
      setMessage(copy.reminderFailed);
    }
  }

  return (
    <Screen>
      <ChipRow>
        <Chip label={copy.taskToday} selected={filter === 'today'} onPress={() => setFilter('today')} />
        <Chip label={copy.taskUpcoming} selected={filter === 'upcoming'} onPress={() => setFilter('upcoming')} />
        <Chip label={copy.taskDone} selected={filter === 'done'} onPress={() => setFilter('done')} />
      </ChipRow>
      <PrimaryButton label={copy.newTask} onPress={() => openPath('/tasks/new')} />
      <FormMessage message={message} />
      {shown.length === 0 ? <ThemedText themeColor="textSecondary">{copy.taskEmpty}</ThemedText> : null}
      {shown.map((task) => {
        const [year, month, day] = (task.dueDate ?? '').split('-').map(Number);
        return (
          <View key={task.id} style={styles.item}>
            <Pressable accessibilityRole="button" onPress={() => openPath(`/tasks/${task.id}`)}>
              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText>{task.title}</ThemedText>
                {task.dueDate ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {formatDateDhaka(dhakaDateToIso(year, month, day), banglaDigits)}
                  </ThemedText>
                ) : null}
                {task.remindAt ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {clockText(task.remindAt, banglaDigits)}
                  </ThemedText>
                ) : null}
              </ThemedView>
            </Pressable>
            <TextButton
              label={task.isDone ? copy.reopenTask : copy.finishTask}
              onPress={() => void toggle(task)}
            />
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: {
    gap: Spacing.one,
  },
  card: {
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.one,
  },
});
