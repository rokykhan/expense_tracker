import { useNavigation } from 'expo-router';
import type { SQLiteDatabase } from 'expo-sqlite';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';

import { copy } from '@/constants/copy';
import { useDataGeneration } from '@/providers/refresh-provider';

export function useDbQuery<T>(load: (db: SQLiteDatabase) => Promise<T>, initial: T) {
  const db = useSQLiteContext();
  const navigation = useNavigation();
  const generation = useDataGeneration();
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const seen = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const tick = retryCount + generation;

    function run() {
      load(db)
        .then((next) => {
          if (cancelled) {
            return;
          }
          seen.current = tick;
          setData(next);
          setError(null);
          setLoading(false);
        })
        .catch((loadError: unknown) => {
          console.error(loadError);
          if (cancelled) {
            return;
          }
          setError(copy.dbError);
          setLoading(false);
        });
    }

    run();
    const unsubscribe = navigation.addListener('focus', run);

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [db, generation, load, navigation, retryCount]);

  const retry = useCallback(() => {
    setRetryCount((value) => value + 1);
  }, []);

  return { data, loading, error, retry };
}
