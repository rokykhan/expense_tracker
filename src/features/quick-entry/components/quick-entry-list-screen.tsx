import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { EmptyScreen } from '@/components/empty-screen';
import { FormMessage, PrimaryButton, TextButton } from '@/components/form';
import { MoneyText } from '@/components/money-text';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { copy } from '@/constants/copy';
import { Spacing } from '@/constants/theme';
import { listQuickEntries, moveQuickEntry } from '@/features/quick-entry/data/quick-entries';
import type { QuickEntryRecord } from '@/features/quick-entry/domain/types';
import { useDbQuery } from '@/hooks/use-db-query';

const EMPTY: QuickEntryRecord[] = [];

export function QuickEntryListScreen() {
  const db = useSQLiteContext();
  const query = useDbQuery(listQuickEntries, EMPTY);
  const [message, setMessage] = useState<string | null>(null);

  if (query.loading) {
    return <EmptyScreen title={copy.quickEntries} message={copy.loading} />;
  }

  if (query.error) {
    return (
      <Screen>
        <FormMessage message={query.error} />
        <PrimaryButton label={copy.retry} onPress={query.retry} />
      </Screen>
    );
  }

  async function move(id: number, direction: -1 | 1) {
    try {
      await moveQuickEntry(db, id, direction);
      query.retry();
    } catch (moveError) {
      console.error(moveError);
      setMessage(copy.dbError);
    }
  }

  return (
    <Screen>
      <PrimaryButton label={copy.newQuickEntry} onPress={() => router.push({ pathname: '/quick-entries/new' })} />
      {message ? <FormMessage message={message} /> : null}
      {query.data.length === 0 ? <ThemedText themeColor="textSecondary">{copy.quickEmpty}</ThemedText> : null}
      {query.data.map((entry) => (
        <View key={entry.id} style={styles.item}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/quick-entries/[id]', params: { id: String(entry.id) } })}>
            <ThemedView type="backgroundElement" style={styles.row}>
              <View style={styles.text}>
                <ThemedText>{entry.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {entry.kind === 'income' ? copy.income : copy.expense}
                </ThemedText>
              </View>
              <MoneyText paisa={entry.amount} />
            </ThemedView>
          </Pressable>
          <View style={styles.moves}>
            <TextButton label={copy.moveUp} onPress={() => void move(entry.id, -1)} />
            <TextButton label={copy.moveDown} onPress={() => void move(entry.id, 1)} />
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: {
    gap: Spacing.one,
  },
  row: {
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  text: {
    flex: 1,
    gap: Spacing.one,
  },
  moves: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.two,
  },
});
