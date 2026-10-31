import { useNavigation } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';

import { copy } from '@/constants/copy';
import { listAccounts } from '@/features/accounts/data/accounts';
import type { AccountRecord } from '@/features/accounts/domain/types';
import { listCategories } from '@/features/categories/data/categories';
import type { CategoryRecord } from '@/features/categories/domain/types';
import { listTransactions } from '@/features/transactions/data/transactions';
import type { TransactionRecord } from '@/features/transactions/domain/types';
import { useDataGeneration } from '@/providers/refresh-provider';

export function useLedger() {
  const db = useSQLiteContext();
  const navigation = useNavigation();
  const generation = useDataGeneration();
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const seen = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const tick = retryCount + generation;

    function run() {
      Promise.all([listAccounts(db), listCategories(db), listTransactions(db)])
        .then(([nextAccounts, nextCategories, nextTransactions]) => {
          if (cancelled) {
            return;
          }
          seen.current = tick;
          setAccounts(nextAccounts);
          setCategories(nextCategories);
          setTransactions(nextTransactions);
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
  }, [db, generation, navigation, retryCount]);

  const retry = useCallback(() => {
    setRetryCount((value) => value + 1);
  }, []);

  return { accounts, categories, transactions, loading, error, retry };
}
