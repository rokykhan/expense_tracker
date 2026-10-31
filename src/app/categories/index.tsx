import { Stack } from 'expo-router';

import { copy } from '@/constants/copy';
import { CategoryListScreen } from '@/features/categories/components/category-list-screen';

export default function CategoryListRoute() {
  return (
    <>
      <Stack.Screen options={{ title: copy.categoriesTitle }} />
      <CategoryListScreen />
    </>
  );
}
