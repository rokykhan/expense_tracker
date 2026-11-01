import { Stack } from 'expo-router';

import { copy } from '@/constants/copy';
import { NoteFormScreen } from '@/features/notes/components/note-form-screen';

export default function NewNoteRoute() {
  return (
    <>
      <Stack.Screen options={{ title: copy.newNote }} />
      <NoteFormScreen noteId={null} />
    </>
  );
}
