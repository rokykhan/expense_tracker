import { type Href, router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { View } from 'react-native';

import { EmptyScreen } from '@/components/empty-screen';
import { Chip, FormMessage, NoteField, PrimaryButton, TextButton, TextField } from '@/components/form';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { copy } from '@/constants/copy';
import { deleteNote, listNotes, saveNote, type NoteRecord } from '@/features/notes/data/notes';
import { useDbQuery } from '@/hooks/use-db-query';
import { leaveScreen } from '@/utils/navigation';

const NO_NOTES: NoteRecord[] = [];

export function NoteFormScreen({ noteId }: { noteId: number | null }) {
  const notes = useDbQuery(listNotes, NO_NOTES);

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

  const existing = noteId == null ? null : (notes.data.find((note) => note.id === noteId) ?? null);
  if (noteId != null && !existing) {
    return <EmptyScreen title={copy.notesTitle} message={copy.notFound} />;
  }

  return <NoteEditor existing={existing} />;
}

function NoteEditor({ existing }: { existing: NoteRecord | null }) {
  const db = useSQLiteContext();
  const [title, setTitle] = useState(existing?.title ?? '');
  const [body, setBody] = useState(existing?.body ?? '');
  const [pinned, setPinned] = useState(existing?.isPinned ?? false);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function save() {
    const trimmed = title.trim();
    if (!trimmed) {
      setMessage(copy.requiredName);
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await saveNote(db, { id: existing?.id, title: trimmed, body: body.trim(), isPinned: pinned });
      leaveScreen();
    } catch (error) {
      console.error(error);
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
      await deleteNote(db, existing.id);
      router.dismissTo('/notes' as Href);
    } catch (error) {
      console.error(error);
      setMessage(copy.dbError);
      setSaving(false);
    }
  }

  return (
    <Screen>
      <TextField label={copy.name} value={title} onChangeText={setTitle} />
      <NoteField label={copy.noteBody} value={body} onChangeText={setBody} />
      <Chip label={pinned ? copy.pinned : copy.pin} selected={pinned} onPress={() => setPinned((value) => !value)} />
      <FormMessage message={message} />
      <PrimaryButton label={copy.save} onPress={() => void save()} disabled={saving} />
      {existing && !confirming ? <TextButton label={copy.delete} onPress={() => setConfirming(true)} /> : null}
      {confirming ? (
        <View>
          <ThemedText>{copy.deleteNotePrompt}</ThemedText>
          <TextButton label={copy.cancel} onPress={() => setConfirming(false)} />
          <TextButton label={copy.confirm} onPress={() => void remove()} />
        </View>
      ) : null}
    </Screen>
  );
}
