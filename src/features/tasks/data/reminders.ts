import { AndroidImportance, SchedulableTriggerInputTypes, cancelScheduledNotificationAsync, getPermissionsAsync, requestPermissionsAsync, scheduleNotificationAsync, setNotificationChannelAsync, setNotificationHandler } from 'expo-notifications';
import { Platform } from 'react-native';

import { ReminderDenied, ReminderUnavailable, type ReminderClient } from '@/features/tasks/data/reminder-client';

const CHANNEL_ID = 'hisabkhata-reminders';

setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensurePermission(): Promise<void> {
  if (Platform.OS === 'android') {
    await setNotificationChannelAsync(CHANNEL_ID, {
      name: 'হিসাবখাতা',
      importance: AndroidImportance.DEFAULT,
    });
  }
  const current = await getPermissionsAsync();
  if (current.status === 'granted') {
    return;
  }
  const asked = await requestPermissionsAsync();
  if (asked.status !== 'granted') {
    throw new ReminderDenied('Notification permission was denied.');
  }
}

export const deviceReminders: ReminderClient = {
  async schedule(when, title, body) {
    try {
      await ensurePermission();
      return await scheduleNotificationAsync({
        content: {
          title,
          body: body ?? undefined,
          sound: false,
        },
        trigger: {
          type: SchedulableTriggerInputTypes.DATE,
          date: when,
          delivery: 'bestEffort',
          ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
        },
      });
    } catch (error) {
      if (error instanceof ReminderDenied) {
        throw error;
      }
      console.error(error);
      throw new ReminderUnavailable('The reminder could not be scheduled.');
    }
  },
  async cancel(id) {
    try {
      await cancelScheduledNotificationAsync(id);
    } catch (error) {
      console.error(error);
      throw new ReminderUnavailable('The reminder could not be cancelled.');
    }
  },
};
