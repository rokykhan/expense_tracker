import { Pressable, StyleSheet } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { copy } from '@/constants/copy';
import { Spacing } from '@/constants/theme';
import { openPath } from '@/utils/navigation';

const LINKS = [
  { label: copy.allEntries, path: '/transactions' },
  { label: copy.quickEntries, path: '/quick-entries' },
  { label: copy.recurringTitle, path: '/recurring' },
  { label: copy.accountsTitle, path: '/accounts' },
  { label: copy.categoriesTitle, path: '/categories' },
  { label: copy.profileTitle, path: '/settings' },
] as const;

export function MoreScreen() {
  return (
    <Screen tabBar>
      {LINKS.map((link) => (
        <Pressable key={link.path} accessibilityRole="button" onPress={() => openPath(link.path)}>
          <ThemedView type="backgroundElement" style={styles.row}>
            <ThemedText>{link.label}</ThemedText>
          </ThemedView>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
});
