import { reminderChange, tasksForFilter } from '@/features/tasks/domain/tasks';

const tasks = [
  { id: 1, dueDate: '2026-11-01', isDone: false },
  { id: 2, dueDate: '2026-10-31', isDone: false },
  { id: 3, dueDate: '2026-11-03', isDone: false },
  { id: 4, dueDate: null, isDone: false },
  { id: 5, dueDate: '2026-11-01', isDone: true },
];

describe('task filters', () => {
  it('keeps overdue work on today, later work as upcoming, and finished work apart', () => {
    expect(tasksForFilter(tasks, 'today', '2026-11-01').map((task) => task.id)).toEqual([1, 2]);
    expect(tasksForFilter(tasks, 'upcoming', '2026-11-01').map((task) => task.id)).toEqual([3, 4]);
    expect(tasksForFilter(tasks, 'done', '2026-11-01').map((task) => task.id)).toEqual([5]);
  });
});

describe('reminder changes', () => {
  const now = Date.parse('2026-11-01T03:00:00.000Z');
  const later = '2026-11-01T03:30:00.000Z';

  it('schedules the chosen future time', () => {
    expect(reminderChange({ remindAt: later, isDone: false, previousId: null, nowMs: now })).toEqual({
      kind: 'schedule',
      whenIso: later,
      cancelId: null,
    });
  });

  it('cancels the old notification when the task is finished, deleted, or the time has passed', () => {
    expect(reminderChange({ remindAt: later, isDone: true, previousId: 'old', nowMs: now })).toEqual({
      kind: 'cancel',
      id: 'old',
    });
    expect(reminderChange({ remindAt: null, isDone: false, previousId: 'old', nowMs: now })).toEqual({
      kind: 'cancel',
      id: 'old',
    });
    expect(
      reminderChange({ remindAt: '2026-11-01T02:00:00.000Z', isDone: false, previousId: 'old', nowMs: now }),
    ).toEqual({ kind: 'cancel', id: 'old' });
  });
});
