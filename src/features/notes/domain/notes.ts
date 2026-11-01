export type NoteItem = {
  title: string;
  body: string;
  isPinned: boolean;
  updatedAt: string;
};

export function visibleNotes<T extends NoteItem>(notes: T[], query: string): T[] {
  const text = query.trim();
  const matched = text
    ? notes.filter((note) => note.title.includes(text) || note.body.includes(text))
    : notes;
  return [...matched].sort(
    (left, right) =>
      Number(right.isPinned) - Number(left.isPinned) || right.updatedAt.localeCompare(left.updatedAt),
  );
}
