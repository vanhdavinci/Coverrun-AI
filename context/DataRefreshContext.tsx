'use client';

import React, { createContext, useContext, useState } from 'react';

interface DataRefreshContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
}

interface DataRefreshProviderProps {
  children: React.ReactNode;
}

const DataRefreshContext = createContext<DataRefreshContextType | null>(null);

export function DataRefreshProvider({ children }: DataRefreshProviderProps): React.JSX.Element {
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const triggerRefresh = (): void => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <DataRefreshContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </DataRefreshContext.Provider>
  );
}

export function useDataRefresh(): DataRefreshContextType {
  const context = useContext(DataRefreshContext);
  if (!context) {
    throw new Error('useDataRefresh must be used within a DataRefreshProvider');
  }
  return context;
}
