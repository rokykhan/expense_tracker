import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import { EmptyScreen } from '@/components/empty-screen';
import { copy } from '@/constants/copy';

type HomeState = 'loading' | 'ready' | 'error';

export default function HomeScreen() {
  const db = useSQLiteContext();
  const [state, setState] = useState<HomeState>('loading');

  useEffect(() => {
    let cancelled = false;

    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM accounts')
      .then((row) => {
        if (!cancelled) {
          setState(row && row.count > 0 ? 'ready' : 'error');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState('error');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [db]);

  if (state === 'loading') {
    return <EmptyScreen title={copy.appName} message={copy.loading} />;
  }

  if (state === 'error') {
    return <EmptyScreen title={copy.appName} message={copy.dbError} />;
  }

  return <EmptyScreen title={copy.appName} message={copy.homeEmpty} />;
}
