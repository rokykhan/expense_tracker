import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { copy } from '@/constants/copy';
import { processDueRules } from '@/features/recurring/data/process';
import { useRefresh } from '@/providers/refresh-provider';

export function RecurringRunner() {
  const db = useSQLiteContext();
  const { bump, setProcessorError } = useRefresh();

  useEffect(() => {
    function run() {
      processDueRules(db)
        .then((count) => {
          setProcessorError(null);
          if (count > 0) {
            bump();
          }
        })
        .catch((error: unknown) => {
          console.error(error);
          setProcessorError(copy.dbError);
        });
    }

    run();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        run();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [bump, db, setProcessorError]);

  return null;
}
