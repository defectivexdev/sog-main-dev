"use client";

import useSWR from "swr";
import { AreaChart, Area, PieChart, Pie, Cell, Legend, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { Activity, TrendingUp, User, ClipboardList, DollarSign, Medal, Clock, Calendar } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function DashboardWidgets() {
  const { data, isLoading } = useSWR('/api/dashboard/widgets', fetcher, { refreshInterval: 5000 });
  const previousTimelineRef = useRef<any[]>([]);

  useEffect(() => {
    if (data?.timeline && Array.isArray(data.timeline)) {
      const currentTimeline = data.timeline;
      const previousTimeline = previousTimelineRef.current;
      
      // If we have previous data, and the latest item's ID is different, trigger a notification!
      if (previousTimeline.length > 0 && currentTimeline.length > 0) {
        if (currentTimeline[0].id !== previousTimeline[0].id) {
          const newItem = currentTimeline[0];
          const isPayment = newItem.type.includes("PAYMENT");
          
          toast(isPayment ? "💰 รายรับใหม่!" : "🛎️ คำร้องใหม่!", {
            description: `${newItem.user} ${newItem.desc}`,
            duration: 5000,
            icon: isPayment ? <DollarSign size={16} color="#fbbf24" /> : <ClipboardList size={16} color="#34d399" />
          });
        }
      }
      
      previousTimelineRef.current = currentTimeline;
    }
  }, [data]);

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
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px", marginTop: "16px" }}>
      
      {/* Chart Widget */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card" 
        style={{ padding: "20px", height: "380px", display: "flex", flexDirection: "column" }}
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
        style={{ padding: "20px", height: "380px", display: "flex", flexDirection: "column" }}
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

      {/* Timeline Widget */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card" 
        style={{ padding: "20px", height: "380px", overflow: "hidden", display: "flex", flexDirection: "column" }}
      >
        <h3 style={{ color: "#e2e8f0", fontSize: "1.1rem", fontWeight: 700, margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Activity size={18} color="#60a5fa" /> ความเคลื่อนไหวล่าสุด
        </h3>
        
        <div style={{ flex: 1, overflowY: "auto", paddingRight: "8px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {safeTimeline.length === 0 ? (
            <div style={{ color: "#94a3b8", textAlign: "center", marginTop: "20px" }}>ไม่มีความเคลื่อนไหว</div>
          ) : (
            safeTimeline.map((item: any, idx: number) => (
              <div key={item.id} style={{ display: "flex", gap: "12px", position: "relative" }}>
                {/* Timeline Line */}
                {idx !== safeTimeline.length - 1 && (
                  <div style={{ position: "absolute", left: "15px", top: "30px", bottom: "-16px", width: "2px", background: "rgba(255,255,255,0.05)" }} />
                )}
                
                {/* Icon */}
                <div style={{ 
                  width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: 1,
                  background: item.type === "PAYMENT_IN" ? "rgba(52, 211, 153, 0.1)" : item.type === "PAYMENT_OUT" ? "rgba(248, 113, 113, 0.1)" : "rgba(96, 165, 250, 0.1)",
                  color: item.type === "PAYMENT_IN" ? "#34d399" : item.type === "PAYMENT_OUT" ? "#f87171" : "#60a5fa"
                }}>
                  {item.type.includes("PAYMENT") ? <DollarSign size={16} /> : <ClipboardList size={16} />}
                </div>

                {/* Content */}
                <div>
                  <div style={{ color: "#e2e8f0", fontSize: "0.9rem", fontWeight: 600 }}>
                    {item.user} <span style={{ color: "#94a3b8", fontWeight: 400 }}>{item.desc}</span>
                  </div>
                  <div style={{ color: "#64748b", fontSize: "0.75rem", marginTop: "2px" }}>
                    {new Date(item.date).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Mini Widgets Row */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        
        {/* Top Donators Widget */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card" 
          style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column" }}
        >
          <h3 style={{ color: "#e2e8f0", fontSize: "1rem", fontWeight: 700, margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Medal size={18} color="#fbbf24" /> สายเปย์ 7 วันล่าสุด
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1, justifyContent: "center" }}>
            {safeTopDonators.length > 0 ? safeTopDonators.map((d: any, i: number) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: i === 0 ? "#fbbf24" : i === 1 ? "#94a3b8" : "#b45309", fontWeight: 800 }}>#{i + 1}</span>
                  <span style={{ color: "#e2e8f0", fontSize: "0.9rem" }}>{d.name}</span>
                </div>
                <span style={{ color: "#c9a227", fontWeight: 700, fontSize: "0.9rem" }}>฿{d.amount.toLocaleString()}</span>
              </div>
            )) : (
              <div style={{ color: "#64748b", textAlign: "center", fontSize: "0.85rem" }}>ยังไม่มีข้อมูลการเปย์</div>
            )}
          </div>
        </motion.div>

        {/* Next Event Widget */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card" 
          style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "linear-gradient(135deg, rgba(201, 162, 39, 0.1), rgba(15, 22, 41, 0.8))" }}
        >
          <Calendar size={24} color="#60a5fa" style={{ marginBottom: "8px" }} />
          <h3 style={{ color: "#94a3b8", fontSize: "0.85rem", fontWeight: 600, margin: "0 0 12px" }}>กิจกรรม / Airdrop ถัดไป</h3>
          
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#e2e8f0", fontSize: "1rem", width: "100%", justifyContent: "center", textAlign: "center" }}>
            {data.upcomingActivity ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{ fontWeight: 800, color: "#e2e8f0", fontSize: "1.2rem", textShadow: "0 0 10px rgba(96,165,250,0.3)" }}>{data.upcomingActivity.name}</span>
                <span style={{ color: "#c9a227", fontSize: "0.9rem", marginTop: "4px", fontWeight: 700 }}>
                  {new Date(data.upcomingActivity.date).toLocaleDateString("th-TH", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} น.
                </span>
              </div>
            ) : (
              <span style={{ color: "#64748b" }}>ไม่มีกิจกรรมเร็วๆ นี้</span>
            )}
          </div>
        </motion.div>
      </div>

    </div>
  );
}


