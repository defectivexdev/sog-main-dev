"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function OnlineTracker() {
  const { status } = useSession();

  useEffect(() => {
    // Only ping if user is authenticated
    if (status !== "authenticated") return;

    const pingServer = async () => {
      try {
        await fetch("/api/ping", { method: "POST" });
      } catch (error) {
        // Ignore errors quietly to avoid spamming the console
      }
    };

    // Ping immediately on mount
    pingServer();

    // Then ping every 3 minutes (180,000 ms)
    const interval = setInterval(pingServer, 3 * 60 * 1000);

    return () => clearInterval(interval);
  }, [status]);

  // This component doesn't render anything
  return null;
}
