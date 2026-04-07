import { createContext, useContext, type ReactNode } from 'react';
import type { ExtendedClient } from './types.ts';

const ClientContext = createContext<ExtendedClient | null>(null);

export function MonkeyTabClientProvider({
  client,
  children,
}: {
  client: ExtendedClient;
  children: ReactNode;
}) {
  return <ClientContext.Provider value={client}>{children}</ClientContext.Provider>;
}

export function useClient(): ExtendedClient {
  const client = useContext(ClientContext);
  if (!client) {
    throw new Error('useClient must be used within a <MonkeyTabClientProvider>');
  }
  return client;
}
