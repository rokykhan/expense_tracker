export type TaskFilter = 'today' | 'upcoming' | 'done';

export type TaskItem = {
  dueDate: string | null;
  isDone: boolean;
};

export type ReminderChange =
  | { kind: 'none' }
  | { kind: 'cancel'; id: string }
  | { kind: 'schedule'; whenIso: string; cancelId: string | null };

export function tasksForFilter<T extends TaskItem>(tasks: T[], filter: TaskFilter, today: string): T[] {
  if (filter === 'done') {
    return tasks.filter((task) => task.isDone);
  }
  return tasks.filter((task) => {
    if (task.isDone) {
      return false;
    }
    if (filter === 'today') {
      return task.dueDate != null && task.dueDate <= today;
    }
    return task.dueDate == null || task.dueDate > today;
  });
}

export function reminderChange(input: {
  remindAt: string | null;
  isDone: boolean;
  previousId: string | null;
  nowMs: number;
}): ReminderChange {
  const when = input.remindAt == null ? Number.NaN : Date.parse(input.remindAt);
  if (!input.isDone && input.remindAt && when > input.nowMs) {
    return { kind: 'schedule', whenIso: input.remindAt, cancelId: input.previousId };
  }
  if (input.previousId) {
    return { kind: 'cancel', id: input.previousId };
  }
  return { kind: 'none' };
}
