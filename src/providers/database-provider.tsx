import { SQLiteProvider } from 'expo-sqlite';
import { Component, Suspense, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { copy } from '@/constants/copy';
import { Spacing } from '@/constants/theme';
import { migrate } from '@/db/migrate';
import { SettingsProvider } from '@/providers/settings-provider';

type DatabaseProviderProps = {
  children: ReactNode;
};

type BoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
};

type BoundaryState = {
  failed: boolean;
};

class DatabaseErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  return (
    <DatabaseErrorBoundary
      fallback={
        <ThemedView style={styles.center}>
          <ThemedText style={styles.message}>{copy.dbError}</ThemedText>
        </ThemedView>
      }>
      <Suspense
        fallback={
          <ThemedView style={styles.center}>
            <ActivityIndicator />
            <ThemedText>{copy.loading}</ThemedText>
          </ThemedView>
        }>
        <SQLiteProvider databaseName="hisabkhata.db" onInit={migrate} useSuspense>
          <SettingsProvider>{children}</SettingsProvider>
        </SQLiteProvider>
      </Suspense>
    </DatabaseErrorBoundary>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  message: {
    textAlign: 'center',
  },
});
