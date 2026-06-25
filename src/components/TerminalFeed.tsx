"use client";

import useSWR from "swr";
import { Terminal, TerminalSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function TerminalFeed() {
  const { data, isLoading } = useSWR('/api/logs/live', fetcher, { refreshInterval: 3000 });
  const [logs, setLogs] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const previousLogsRef = useRef<any[]>([]);

  useEffect(() => {
    if (data?.logs && Array.isArray(data.logs)) {
      const currentLogs = data.logs;
      const previousLogs = previousLogsRef.current;
      
      if (previousLogs.length > 0 && currentLogs.length > 0) {
        if (currentLogs[0].id !== previousLogs[0].id) {
          const newItem = currentLogs[0];
          
          toast(`[${newItem.type}] การอัปเดตใหม่!`, {
            description: `${newItem.actor} ${newItem.action} ${newItem.message}`,
            duration: 6000,
            icon: <Terminal size={16} color={newItem.color} />
          });
        }
      }
      
      previousLogsRef.current = currentLogs;
      setLogs(currentLogs);
    }
  }, [data]);

  useEffect(() => {
    // Auto scroll to top when new logs arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [logs]);

  return (
    <div className="glass-card" style={{ 
      padding: "20px", 
      height: "400px", 
      display: "flex", 
      flexDirection: "column",
      background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(0, 0, 0, 0.95))",
      border: "1px solid rgba(52, 211, 153, 0.2)",
      boxShadow: "0 0 20px rgba(52, 211, 153, 0.05) inset",
      fontFamily: "'Fira Code', 'Courier New', monospace"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", borderBottom: "1px solid rgba(52, 211, 153, 0.2)", paddingBottom: "12px" }}>
        <TerminalSquare size={20} color="#34d399" />
        <h3 style={{ color: "#34d399", fontSize: "1.1rem", fontWeight: 700, margin: 0, textShadow: "0 0 8px rgba(52,211,153,0.4)" }}>
          SOG_COMMAND_CENTER // LIVE_FEED
        </h3>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#34d399", boxShadow: "0 0 8px #34d399", animation: "pulse 2s infinite" }} />
          <span style={{ color: "#34d399", fontSize: "0.8rem", opacity: 0.8 }}>SYNCING</span>
        </div>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", paddingRight: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {isLoading && logs.length === 0 ? (
          <div style={{ color: "#34d399", opacity: 0.5 }}>&gt; Initializing connection...</div>
        ) : logs.length === 0 ? (
          <div style={{ color: "#64748b" }}>&gt; No signals detected.</div>
        ) : (
          <AnimatePresence>
            {logs.map((log: any, idx: number) => {
              const timeString = new Date(log.timestamp).toLocaleTimeString("th-TH", { hour12: false });
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    display: "flex",
                    gap: "12px",
                    fontSize: "0.9rem",
                    padding: "6px 8px",
                    background: idx === 0 ? "rgba(52, 211, 153, 0.05)" : "transparent",
                    borderRadius: "4px",
                    borderLeft: idx === 0 ? "2px solid #34d399" : "2px solid transparent"
                  }}
                >
                  <span style={{ color: "#64748b", flexShrink: 0 }}>[{timeString}]</span>
                  <span style={{ color: log.color, fontWeight: 700, minWidth: "100px" }}>[{log.type}]</span>
                  <span style={{ color: "#e2e8f0" }}>
                    <strong style={{ color: "#38bdf8" }}>{log.actor}</strong> {log.action} <span style={{ opacity: 0.7 }}>{log.message}</span>
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}} />
    </div>
  );
}
