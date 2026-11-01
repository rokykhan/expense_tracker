import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { EmptyScreen } from '@/components/empty-screen';
import { FormMessage, PrimaryButton, TextButton, TextField } from '@/components/form';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { copy } from '@/constants/copy';
import { Spacing } from '@/constants/theme';
import { listNotes, setNotePinned, type NoteRecord } from '@/features/notes/data/notes';
import { visibleNotes } from '@/features/notes/domain/notes';
import { useDbQuery } from '@/hooks/use-db-query';
import { useRefresh } from '@/providers/refresh-provider';
import { openPath } from '@/utils/navigation';

const NO_NOTES: NoteRecord[] = [];

export function NoteListScreen() {
  const db = useSQLiteContext();
  const notes = useDbQuery(listNotes, NO_NOTES);
  const { bump } = useRefresh();
  const [query, setQuery] = useState('');

  if (notes.loading) {
    return <EmptyScreen title={copy.notesTitle} message={copy.loading} />;
  }

  if (notes.error) {
    return (
      <Screen>
        <FormMessage message={notes.error} />
        <PrimaryButton label={copy.retry} onPress={notes.retry} />
      </Screen>
    );
  }

  const shown = visibleNotes(notes.data, query);

  async function togglePin(note: NoteRecord) {
    try {
      await setNotePinned(db, note.id, !note.isPinned);
      bump();
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Screen>
      <TextField label={copy.searchNotes} value={query} onChangeText={setQuery} />
      <PrimaryButton label={copy.newNote} onPress={() => openPath('/notes/new')} />
      {shown.length === 0 ? (
        <ThemedText themeColor="textSecondary">{query.trim() ? copy.noteSearchEmpty : copy.noteEmpty}</ThemedText>
      ) : null}
      {shown.map((note) => (
        <View key={note.id} style={styles.item}>
          <Pressable accessibilityRole="button" onPress={() => openPath(`/notes/${note.id}`)} style={styles.flex}>
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText>{note.title}</ThemedText>
              {note.isPinned ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {copy.pinned}
                </ThemedText>
              ) : null}
              {note.body ? (
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                  {note.body}
                </ThemedText>
              ) : null}
            </ThemedView>
          </Pressable>
          <TextButton label={note.isPinned ? copy.unpin : copy.pin} onPress={() => void togglePin(note)} />
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: {
    gap: Spacing.one,
  },
  flex: {
    flexGrow: 1,
  },
  card: {
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.one,
  },
});
