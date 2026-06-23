"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { motion } from "framer-motion";

interface ChartProps {
  data: { date: string; income: number; expense: number }[];
}

export default function FinancialChart({ data }: ChartProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: 0.2 }}
      className="glass-card" 
      style={{ padding: "24px", height: "100%", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}
    >
      <div style={{ marginBottom: "20px", position: "relative", zIndex: 1 }}>
        <h3 style={{ color: "#c9a227", fontWeight: 800, fontSize: "1.1rem", margin: "0 0 4px" }}>💰 สรุปการเงิน 7 วันล่าสุด</h3>
        <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>เปรียบเทียบรายรับและรายจ่ายของแก๊งค์ (เฉพาะที่ได้รับการยืนยันแล้ว)</p>
      </div>

      <div style={{ flex: 1, minHeight: 0, width: "100%", position: "relative" }}>
        {data.length === 0 ? (
          <div style={{ height: "300px", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
            ไม่มีข้อมูลการเงินใน 7 วันที่ผ่านมา
          </div>
        ) : (
          <ResponsiveContainer width="99%" minHeight={300}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `฿${value}`} />
              <Tooltip 
                cursor={{ fill: "rgba(255,255,255,0.05)" }}
                contentStyle={{ background: "rgba(15,22,41,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#e2e8f0" }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: "0.85rem", paddingTop: "10px" }} />
              <Bar dataKey="income" name="รายรับ" fill="#34d399" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="expense" name="รายจ่าย" fill="#f87171" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}
