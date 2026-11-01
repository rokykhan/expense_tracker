import type { SQLiteDatabase } from 'expo-sqlite';

import type { ReminderClient } from '@/features/tasks/data/reminder-client';
import { reminderChange, type ReminderChange } from '@/features/tasks/domain/tasks';

export type TaskRecord = {
  id: number;
  title: string;
  note: string | null;
  dueDate: string | null;
  remindAt: string | null;
  isDone: boolean;
  notificationId: string | null;
  createdAt: string;
  updatedAt: string;
};

type TaskRow = {
  id: number;
  title: string;
  note: string | null;
  due_date: string | null;
  remind_at: string | null;
  is_done: number;
  notification_id: string | null;
  created_at: string;
  updated_at: string;
};

export type TaskInput = {
  id?: number;
  title: string;
  note: string | null;
  dueDate: string | null;
  remindAt: string | null;
  isDone: boolean;
};

function mapTask(row: TaskRow): TaskRecord {
  return {
    id: Number(row.id),
    title: row.title,
    note: row.note,
    dueDate: row.due_date,
    remindAt: row.remind_at,
    isDone: Number(row.is_done) === 1,
    notificationId: row.notification_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listTasks(db: SQLiteDatabase): Promise<TaskRecord[]> {
  const rows = await db.getAllAsync<TaskRow>(
    `SELECT id, title, note, due_date, remind_at, is_done, notification_id, created_at, updated_at
     FROM tasks
     ORDER BY due_date IS NULL, due_date, id DESC`,
  );
  return rows.map(mapTask);
}

async function taskById(db: SQLiteDatabase, id: number): Promise<TaskRecord | null> {
  const row = await db.getFirstAsync<TaskRow>(
    `SELECT id, title, note, due_date, remind_at, is_done, notification_id, created_at, updated_at
     FROM tasks WHERE id = ?`,
    id,
  );
  return row ? mapTask(row) : null;
}

async function notificationIdFor(reminders: ReminderClient, change: ReminderChange, title: string, note: string | null) {
  if (change.kind === 'schedule') {
    const id = await reminders.schedule(new Date(change.whenIso), title, note);
    if (change.cancelId && change.cancelId !== id) {
      try {
        await reminders.cancel(change.cancelId);
      } catch (error) {
        console.error(error);
      }
    }
    return id;
  }
  if (change.kind === 'cancel') {
    try {
      await reminders.cancel(change.id);
    } catch (error) {
      console.error(error);
    }
    return null;
  }
  return null;
}

export async function saveTask(db: SQLiteDatabase, input: TaskInput, reminders: ReminderClient): Promise<void> {
  const now = new Date().toISOString();
  const previous = input.id == null ? null : await taskById(db, input.id);
  const change = reminderChange({
    remindAt: input.remindAt,
    isDone: input.isDone,
    previousId: previous?.notificationId ?? null,
    nowMs: Date.now(),
  });
  const notificationId = await notificationIdFor(reminders, change, input.title, input.note);

  if (input.id == null) {
    await db.runAsync(
      `INSERT INTO tasks (title, note, due_date, remind_at, is_done, notification_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      input.title,
      input.note,
      input.dueDate,
      input.remindAt,
      input.isDone ? 1 : 0,
      notificationId,
      now,
      now,
    );
    return;
  }

  await db.runAsync(
    `UPDATE tasks
     SET title = ?, note = ?, due_date = ?, remind_at = ?, is_done = ?, notification_id = ?, updated_at = ?
     WHERE id = ?`,
    input.title,
    input.note,
    input.dueDate,
    input.remindAt,
    input.isDone ? 1 : 0,
    notificationId,
    now,
    input.id,
  );
}

export async function setTaskDone(db: SQLiteDatabase, id: number, isDone: boolean, reminders: ReminderClient): Promise<void> {
  const task = await taskById(db, id);
  if (!task) {
    return;
  }
  await saveTask(
    db,
    {
      id: task.id,
      title: task.title,
      note: task.note,
      dueDate: task.dueDate,
      remindAt: task.remindAt,
      isDone,
    },
    reminders,
  );
}

export async function deleteTask(db: SQLiteDatabase, id: number, reminders: ReminderClient): Promise<void> {
  const task = await taskById(db, id);
  if (task?.notificationId) {
    try {
      await reminders.cancel(task.notificationId);
    } catch (error) {
      console.error(error);
    }
  }
  await db.runAsync('DELETE FROM tasks WHERE id = ?', id);
}
