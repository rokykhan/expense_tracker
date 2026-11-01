import type { SQLiteDatabase } from 'expo-sqlite';

export type NoteRecord = {
  id: number;
  title: string;
  body: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
};

type NoteRow = {
  id: number;
  title: string;
  body: string;
  is_pinned: number;
  created_at: string;
  updated_at: string;
};

function mapNote(row: NoteRow): NoteRecord {
  return {
    id: Number(row.id),
    title: row.title,
    body: row.body,
    isPinned: Number(row.is_pinned) === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listNotes(db: SQLiteDatabase): Promise<NoteRecord[]> {
  const rows = await db.getAllAsync<NoteRow>(
    'SELECT id, title, body, is_pinned, created_at, updated_at FROM notes ORDER BY updated_at DESC, id DESC',
  );
  return rows.map(mapNote);
}

export async function saveNote(
  db: SQLiteDatabase,
  input: { id?: number; title: string; body: string; isPinned: boolean },
): Promise<void> {
  const now = new Date().toISOString();
  if (input.id == null) {
    await db.runAsync(
      'INSERT INTO notes (title, body, is_pinned, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      input.title,
      input.body,
      input.isPinned ? 1 : 0,
      now,
      now,
    );
    return;
  }
  await db.runAsync(
    'UPDATE notes SET title = ?, body = ?, is_pinned = ?, updated_at = ? WHERE id = ?',
    input.title,
    input.body,
    input.isPinned ? 1 : 0,
    now,
    input.id,
  );
}

export async function setNotePinned(db: SQLiteDatabase, id: number, isPinned: boolean): Promise<void> {
  await db.runAsync('UPDATE notes SET is_pinned = ?, updated_at = ? WHERE id = ?', isPinned ? 1 : 0, new Date().toISOString(), id);
}

export async function deleteNote(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM notes WHERE id = ?', id);
}
