import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

type ScreenProps = {
  children: ReactNode;
  tabBar?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Screen({ children, tabBar = false, style }: ScreenProps) {
  return (
    <ThemedView style={styles.fill}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Spacing.five + (tabBar ? BottomTabInset + Spacing.four : 0) },
          style,
        ]}
        keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.three,
    gap: Spacing.three,
  },
});
