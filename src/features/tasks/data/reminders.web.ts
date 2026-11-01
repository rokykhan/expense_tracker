import { ReminderUnavailable, type ReminderClient } from '@/features/tasks/data/reminder-client';

export const deviceReminders: ReminderClient = {
  async schedule() {
    throw new ReminderUnavailable('Reminders are scheduled on the phone.');
  },
  async cancel() {
    return undefined;
  },
};
