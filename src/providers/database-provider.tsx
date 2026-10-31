import { SQLiteProvider } from 'expo-sqlite';
import { Component, Suspense, useSyncExternalStore, type ReactNode } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { copy } from '@/constants/copy';
import { Spacing } from '@/constants/theme';
import { migrate } from '@/db/migrate';
import { RecurringRunner } from '@/features/recurring/components/recurring-runner';
import { RefreshProvider } from '@/providers/refresh-provider';
import { SettingsProvider } from '@/providers/settings-provider';

type DatabaseProviderProps = {
  children: ReactNode;
};

type BoundaryProps = {
  children: ReactNode;
  fallback: (retry: () => void) => ReactNode;
};

type BoundaryState = {
  failed: boolean;
};

class ScreenErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error(error);
  }

  retry = () => {
    this.setState({ failed: false });
  };

  render() {
    if (this.state.failed) {
      return this.props.fallback(this.retry);
    }
    return this.props.children;
  }
}

function reloadApp(retry: () => void) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.location.reload();
    return;
  }
  retry();
}

function Failure({ message, retry }: { message: string; retry: () => void }) {
  return (
    <ThemedView style={styles.center}>
      <ThemedText style={styles.message}>{message}</ThemedText>
      <Pressable accessibilityRole="button" onPress={() => reloadApp(retry)} style={styles.retry}>
        <ThemedText type="smallBold">{copy.retry}</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

function Loading() {
  return (
    <ThemedView style={styles.center}>
      <ActivityIndicator />
      <ThemedText>{copy.loading}</ThemedText>
    </ThemedView>
  );
}

function subscribeToNothing() {
  return () => {};
}

function useClientReady() {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => Platform.OS !== 'web',
  );
}

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const ready = useClientReady();

  if (!ready) {
    return <Loading />;
  }

  return (
    <ScreenErrorBoundary fallback={(retry) => <Failure message={copy.dbError} retry={retry} />}>
      <Suspense fallback={<Loading />}>
        <SQLiteProvider databaseName="hisabkhata.db" onInit={migrate} useSuspense>
          <ScreenErrorBoundary fallback={(retry) => <Failure message={copy.pageError} retry={retry} />}>
            <RefreshProvider>
              <RecurringRunner />
              <SettingsProvider>{children}</SettingsProvider>
            </RefreshProvider>
          </ScreenErrorBoundary>
        </SQLiteProvider>
      </Suspense>
    </ScreenErrorBoundary>
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
  retry: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
});
