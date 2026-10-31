import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { EmptyScreen } from '@/components/empty-screen';
import { FormMessage, PrimaryButton } from '@/components/form';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { copy } from '@/constants/copy';
import { Spacing } from '@/constants/theme';
import type { CategoryRecord } from '@/features/categories/domain/types';
import { useLedger } from '@/features/transactions/data/use-ledger';

export function CategoryListScreen() {
  const ledger = useLedger();

  if (ledger.loading) {
    return <EmptyScreen title={copy.categoriesTitle} message={copy.loading} />;
  }

  if (ledger.error) {
    return (
      <Screen>
        <FormMessage message={ledger.error} />
        <PrimaryButton label={copy.retry} onPress={ledger.retry} />
      </Screen>
    );
  }

  return (
    <Screen>
      <PrimaryButton label={copy.newCategory} onPress={() => router.push({ pathname: '/categories/new' })} />
      {ledger.categories.length === 0 ? (
        <ThemedText themeColor="textSecondary">{copy.noCategories}</ThemedText>
      ) : null}
      <CategorySection
        title={copy.expense}
        categories={ledger.categories.filter((category) => category.kind === 'expense')}
      />
      <CategorySection
        title={copy.income}
        categories={ledger.categories.filter((category) => category.kind === 'income')}
      />
    </Screen>
  );
}

function CategorySection({ title, categories }: { title: string; categories: CategoryRecord[] }) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {title}
      </ThemedText>
      {categories.map((category) => (
        <Pressable
          key={category.id}
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/categories/[id]', params: { id: String(category.id) } })}>
          <ThemedView type="backgroundElement" style={styles.row}>
            <View style={[styles.dot, { backgroundColor: category.color }]} />
            <ThemedText style={styles.name}>{category.name}</ThemedText>
          </ThemedView>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  row: {
    borderRadius: 14,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  name: {
    flex: 1,
  },
});
