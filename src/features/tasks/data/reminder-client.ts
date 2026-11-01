export class ReminderDenied extends Error {}

export class ReminderUnavailable extends Error {}

export type ReminderClient = {
  schedule(when: Date, title: string, body: string | null): Promise<string>;
  cancel(id: string): Promise<void>;
};
