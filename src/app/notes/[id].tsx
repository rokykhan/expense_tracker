import { Stack, useLocalSearchParams } from 'expo-router';

import { copy } from '@/constants/copy';
import { NoteFormScreen } from '@/features/notes/components/note-form-screen';

export default function EditNoteRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const noteId = Number(id);
  return (
    <>
      <Stack.Screen options={{ title: copy.editNote }} />
      <NoteFormScreen noteId={Number.isInteger(noteId) ? noteId : null} />
    </>
  );
}
