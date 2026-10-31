import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { FormMessage, TextButton } from '@/components/form';
import { MoneyText } from '@/components/money-text';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { copy } from '@/constants/copy';
import { Spacing } from '@/constants/theme';
import { applyQuickEntry } from '@/features/quick-entry/data/quick-entries';
import type { QuickEntryRecord } from '@/features/quick-entry/domain/types';
import { openPath } from '@/utils/navigation';

export function QuickEntryBar({
  entries,
  error,
  onApplied,
}: {
  entries: QuickEntryRecord[];
  error: string | null;
  onApplied: () => void;
}) {
  const db = useSQLiteContext();
  const [message, setMessage] = useState<string | null>(null);
  const [postingId, setPostingId] = useState<number | null>(null);

  async function apply(entry: QuickEntryRecord) {
    if (postingId != null) {
      return;
    }
    setPostingId(entry.id);
    setMessage(null);
    try {
      await applyQuickEntry(db, entry);
      onApplied();
    } catch (applyError) {
      console.error(applyError);
      setMessage(copy.dbError);
    } finally {
      setPostingId(null);
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.heading}>
        <ThemedText type="smallBold">{copy.quickEntries}</ThemedText>
        <TextButton label={copy.manage} onPress={() => openPath('/quick-entries')} />
      </View>
      {error ? <FormMessage message={error} /> : null}
      {message ? <FormMessage message={message} /> : null}
      {entries.length === 0 ? (
        <ThemedText themeColor="textSecondary">{copy.quickEmpty}</ThemedText>
      ) : (
        <View style={styles.row}>
          {entries.map((entry) => (
            <Pressable
              key={entry.id}
              accessibilityRole="button"
              accessibilityLabel={entry.title}
              disabled={postingId != null}
              onPress={() => void apply(entry)}>
              <ThemedView type="backgroundElement" style={styles.button}>
                <ThemedText type="smallBold">{entry.title}</ThemedText>
                <MoneyText paisa={entry.amount} type="small" />
              </ThemedView>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.two,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  button: {
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.one,
    minWidth: 96,
  },
});
