"use client";

import useSWR from "swr";
import { AreaChart, Area, PieChart, Pie, Cell, Legend, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { Activity, TrendingUp, User, ClipboardList, DollarSign, Medal, Calendar, Terminal } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function DashboardWidgets() {
  const { data, isLoading } = useSWR('/api/dashboard/widgets', fetcher, { refreshInterval: 5000 });
  const { data: liveData } = useSWR('/api/logs/live', fetcher, { refreshInterval: 3000 });
  const previousLogsRef = useRef<any[]>([]);

  useEffect(() => {
    if (liveData?.logs && Array.isArray(liveData.logs)) {
      const currentLogs = liveData.logs;
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
    }
  }, [liveData]);

  if (isLoading) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px", marginTop: "16px" }}>
        <div className="glass-card" style={{ height: "350px", padding: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#94a3b8" }}>กำลังโหลดกราฟ...</span>
        </div>
        <div className="glass-card" style={{ height: "350px", padding: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#94a3b8" }}>กำลังโหลดไทม์ไลน์...</span>
        </div>
      </div>
    );
  }

  if (!data) return null;
  if (data.error) {
    return (
      <div style={{ color: "#f87171", textAlign: "center", padding: "40px", background: "rgba(248,113,113,0.1)", borderRadius: "12px", marginTop: "16px" }}>
        เกิดข้อผิดพลาดในการโหลดข้อมูล: {data.error}
      </div>
    );
  }

  // Ensure arrays exist
  const safeChartData = Array.isArray(data.chartData) ? data.chartData : [];
  const safeTimeline = Array.isArray(data.timeline) ? data.timeline : [];
  const safeTopDonators = Array.isArray(data.topDonators) ? data.topDonators : [];

  const safeLeaveStats = Array.isArray(data.leaveStats) ? data.leaveStats : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "16px" }}>
      
      {/* Top Row: Chart & Pie */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
        
        {/* Chart Widget */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card" 
          style={{ padding: "20px", height: "380px", display: "flex", flexDirection: "column", flex: "2 1 600px", minWidth: 0 }}
        >
          <h3 style={{ color: "#e2e8f0", fontSize: "1.1rem", fontWeight: 700, margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <TrendingUp size={18} color="#c9a227" /> สถิติรายได้ 7 วันย้อนหลัง
          </h3>
          
          <div style={{ flex: 1, width: "100%", height: "250px" }}>
            <ResponsiveContainer width="99%" minHeight={250}>
              <AreaChart data={safeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c9a227" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#c9a227" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `฿${value}`} />
                <Tooltip 
                  contentStyle={{ background: "rgba(15, 23, 42, 0.9)", border: "1px solid rgba(201, 162, 39, 0.2)", borderRadius: "8px", color: "#fff" }}
                  itemStyle={{ fontWeight: "bold" }}
                  formatter={(value: any, name: any) => [`฿${Number(value).toLocaleString()}`, name === "income" ? "รายได้" : "รายจ่าย"]}
                />
                <Area type="monotone" dataKey="income" name="income" stroke="#c9a227" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" name="expense" stroke="#f87171" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Leave Stats Pie Chart Widget */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card" 
          style={{ padding: "20px", height: "380px", display: "flex", flexDirection: "column", flex: "1 1 300px", minWidth: 0 }}
        >
          <h3 style={{ color: "#e2e8f0", fontSize: "1.1rem", fontWeight: 700, margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <ClipboardList size={18} color="#34d399" /> สถิติการแจ้งลางานทั้งหมด
          </h3>
          <div style={{ flex: 1, width: "100%", height: "250px", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={safeLeaveStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {safeLeaveStats.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: "rgba(15, 23, 42, 0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" }}
                  itemStyle={{ fontWeight: "bold" }}
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: "12px", color: "#cbd5e1" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </div>
    </div>
  );
}


