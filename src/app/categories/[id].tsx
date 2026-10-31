import { Stack, useLocalSearchParams } from 'expo-router';

import { copy } from '@/constants/copy';
import { CategoryFormScreen } from '@/features/categories/components/category-form-screen';

export default function EditCategoryRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const categoryId = Number(id);

  return (
    <>
      <Stack.Screen options={{ title: copy.editCategory }} />
      <CategoryFormScreen categoryId={Number.isInteger(categoryId) ? categoryId : -1} />
    </>
  );
}
