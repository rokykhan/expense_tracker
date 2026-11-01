import { Stack } from 'expo-router';

import { copy } from '@/constants/copy';
import { TaskListScreen } from '@/features/tasks/components/task-list-screen';

export default function TasksRoute() {
  return (
    <>
      <Stack.Screen options={{ title: copy.tasksTitle }} />
      <TaskListScreen />
    </>
  );
}
