"use client";

import { SWRConfig } from "swr";
import { ReactNode } from "react";

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig 
      value={{
        fetcher: (url: string) => fetch(url).then(res => res.json()),
        revalidateOnFocus: true, // Refetch when user switches tabs
        dedupingInterval: 2000, 
        refreshInterval: 5000, // Auto refresh all data every 5 seconds
        keepPreviousData: true,
        shouldRetryOnError: false
      }}
    >
      {children}
    </SWRConfig>
  );
}
