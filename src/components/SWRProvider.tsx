"use client";

import { SWRConfig } from "swr";
import { ReactNode } from "react";

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig 
      value={{
        fetcher: (url: string) => fetch(url).then(res => res.json()),
        revalidateOnFocus: false, // Don't refetch when user switches tabs
        dedupingInterval: 5000, // Dedupe requests within 5 seconds
        keepPreviousData: true, // Prevent loading flickers when fetching new data
        shouldRetryOnError: false // Prevent spamming retries if API fails
      }}
    >
      {children}
    </SWRConfig>
  );
}
