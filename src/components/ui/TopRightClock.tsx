"use client";
import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export default function TopRightClock() {
  const [time, setTime] = useState<Date | null>(null);
  
  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div style={{ 
      background: "rgba(15,22,41,0.6)", 
      padding: "6px 14px", 
      borderRadius: "20px", 
      display: "flex", 
      alignItems: "center", 
      gap: "8px", 
      fontSize: "0.95rem", 
      fontWeight: 700,
      border: "1px solid rgba(201,162,39,0.3)",
      color: "#c9a227",
      boxShadow: "0 0 15px rgba(201,162,39,0.15)"
    }}>
      <Clock size={16} />
      {time ? time.toLocaleTimeString("th-TH", { timeZone: "Asia/Bangkok", hour12: false }) : "--:--:--"}
    </div>
  );
}
