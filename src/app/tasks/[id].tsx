import { Stack, useLocalSearchParams } from 'expo-router';

import { copy } from '@/constants/copy';
import { TaskFormScreen } from '@/features/tasks/components/task-form-screen';

export default function EditTaskRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const taskId = Number(id);
  return (
    <>
      <Stack.Screen options={{ title: copy.editTask }} />
      <TaskFormScreen taskId={Number.isInteger(taskId) ? taskId : null} />
    </>
  );
}
