import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type RefreshValue = {
  generation: number;
  bump: () => void;
  processorError: string | null;
  setProcessorError: (message: string | null) => void;
};

const RefreshContext = createContext<RefreshValue | null>(null);

export function RefreshProvider({ children }: { children: ReactNode }) {
  const [generation, setGeneration] = useState(0);
  const [processorError, setProcessorError] = useState<string | null>(null);
  const bump = useCallback(() => setGeneration((value) => value + 1), []);
  const value = useMemo(
    () => ({ generation, bump, processorError, setProcessorError }),
    [generation, bump, processorError],
  );

  return <RefreshContext.Provider value={value}>{children}</RefreshContext.Provider>;
}

function useRefreshContext() {
  const value = useContext(RefreshContext);
  if (!value) {
    throw new Error('RefreshProvider is missing.');
  }
  return value;
}

export function useDataGeneration() {
  return useRefreshContext().generation;
}

export function useRefresh() {
  const { bump, processorError, setProcessorError } = useRefreshContext();
  return { bump, processorError, setProcessorError };
}
