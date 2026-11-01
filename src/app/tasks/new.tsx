import { Stack } from 'expo-router';

import { copy } from '@/constants/copy';
import { TaskFormScreen } from '@/features/tasks/components/task-form-screen';

export default function NewTaskRoute() {
  return (
    <>
      <Stack.Screen options={{ title: copy.newTask }} />
      <TaskFormScreen taskId={null} />
    </>
  );
}
