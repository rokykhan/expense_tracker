import { Stack } from 'expo-router';

import { copy } from '@/constants/copy';
import { NoteListScreen } from '@/features/notes/components/note-list-screen';

export default function NotesRoute() {
  return (
    <>
      <Stack.Screen options={{ title: copy.notesTitle }} />
      <NoteListScreen />
    </>
  );
}
