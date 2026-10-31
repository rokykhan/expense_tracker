import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';

import { copy } from '@/constants/copy';
import { listAccounts } from '@/features/accounts/data/accounts';
import type { AccountRecord } from '@/features/accounts/domain/types';
import { listCategories } from '@/features/categories/data/categories';
import type { CategoryRecord } from '@/features/categories/domain/types';
import { listTransactions } from '@/features/transactions/data/transactions';
import type { TransactionRecord } from '@/features/transactions/domain/types';

export function useLedger() {
  const db = useSQLiteContext();
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void retryCount;
      Promise.all([listAccounts(db), listCategories(db), listTransactions(db)])
        .then(([nextAccounts, nextCategories, nextTransactions]) => {
          if (cancelled) {
            return;
          }
          setAccounts(nextAccounts);
          setCategories(nextCategories);
          setTransactions(nextTransactions);
          setError(null);
          setLoading(false);
        })
        .catch(() => {
          if (cancelled) {
            return;
          }
          setError(copy.dbError);
          setLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }, [db, retryCount]),
  );

  const retry = useCallback(() => {
    setRetryCount((value) => value + 1);
  }, []);

  return { accounts, categories, transactions, loading, error, retry };
}
