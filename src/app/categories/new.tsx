import { Stack } from 'expo-router';

import { copy } from '@/constants/copy';
import { CategoryFormScreen } from '@/features/categories/components/category-form-screen';

export default function NewCategoryRoute() {
  return (
    <>
      <Stack.Screen options={{ title: copy.newCategory }} />
      <CategoryFormScreen categoryId={null} />
    </>
  );
}
