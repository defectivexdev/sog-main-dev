"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, DollarSign, CheckCircle, Target } from "lucide-react";

import useSWR from "swr";

interface LeaderboardData {
  name: string;
  score: number;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function LeaderboardPage() {
  const { data: fetchRes, isLoading } = useSWR('/api/leaderboard', fetcher);
  const rawData = fetchRes?.data || fetchRes || {};
  const data = {
    topAttendance: Array.isArray(rawData.topAttendance) ? rawData.topAttendance : [],
    topDonators: Array.isArray(rawData.topDonators) ? rawData.topDonators : [],
    topActivity: Array.isArray(rawData.topActivity) ? rawData.topActivity : [],
  };

  const getRankColor = (index: number) => {
    if (index === 0) return "#fbbf24"; // Gold
    if (index === 1) return "#94a3b8"; // Silver
    if (index === 2) return "#b45309"; // Bronze
    return "rgba(255,255,255,0.1)"; // Others
  };

  const RankCard = ({ title, icon, dataList, valuePrefix = "", valueSuffix = "" }: any) => (
    <div className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column" }}>
      <h2 style={{ color: "#c9a227", fontWeight: 800, fontSize: "1.2rem", margin: "0 0 20px", display: "flex", alignItems: "center", gap: "8px" }}>
        {icon} {title}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
        {dataList.length === 0 ? (
          <div style={{ color: "#64748b", textAlign: "center", padding: "20px 0" }}>ยังไม่มีข้อมูล</div>
        ) : (
          dataList.map((item: any, index: number) => {
            const isTop3 = index < 3;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={isTop3 ? { scale: 1.05, rotateX: 5, rotateY: 5, zIndex: 10 } : { x: 5 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: isTop3 ? "16px" : "12px 16px",
                  background: isTop3 
                    ? `linear-gradient(135deg, ${getRankColor(index)}20, rgba(255,255,255,0.05))` 
                    : "rgba(255,255,255,0.03)",
                  borderRadius: "12px",
                  border: isTop3 ? `1px solid ${getRankColor(index)}50` : "1px solid rgba(255,255,255,0.05)",
                  boxShadow: isTop3 ? `0 10px 20px -10px ${getRankColor(index)}40` : "none",
                  position: "relative",
                  transformStyle: "preserve-3d"
                }}
              >
                {/* Crown for Rank 1 */}
                {index === 0 && (
                  <div style={{ position: "absolute", top: "-12px", right: "12px", fontSize: "1.5rem", filter: "drop-shadow(0 0 5px rgba(251,191,36,0.5))" }}>
                    👑
                  </div>
                )}
                
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ 
                    width: isTop3 ? "36px" : "28px", 
                    height: isTop3 ? "36px" : "28px", 
                    borderRadius: "50%", 
                    background: getRankColor(index), 
                    color: index < 3 ? "#000" : "#fff",
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: isTop3 ? "1rem" : "0.85rem",
                    boxShadow: index < 3 ? `0 0 10px ${getRankColor(index)}80` : "none"
                  }}>
                    {index + 1}
                  </div>
                  <span style={{ color: index < 3 ? "#fff" : "#e2e8f0", fontWeight: index < 3 ? 800 : 600, fontSize: isTop3 ? "1.1rem" : "0.95rem" }}>
                    {item.name}
                  </span>
                </div>
                <div style={{ color: getRankColor(index), fontWeight: 800, fontSize: isTop3 ? "1.1rem" : "0.95rem" }}>
                  {valuePrefix}{item.score.toLocaleString()}{valueSuffix}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );

  const [activeTab, setActiveTab] = useState("attendance");

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Trophy size={32} color="#c9a227" /> ทำเนียบผู้ทรงเกียรติ (Leaderboard)
        </h1>
        <p className="page-subtitle">จัดอันดับสมาชิกดีเด่นในด้านต่างๆ ของแก๊งค์ SOG</p>
      </div>

      {isLoading ? (
        <div className="animate-fade-in" style={{ paddingBottom: "40px" }}>
          <h1 className="page-title" style={{ margin: "0 0 24px", fontSize: "2rem", fontWeight: 800 }}>กำลังโหลด...</h1>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: "20px" }}>
          {/* Animated Tabs */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "24px", background: "rgba(0,0,0,0.3)", padding: "6px", borderRadius: "12px", width: "fit-content" }}>
            {[
              { id: "attendance", label: "ขยันทำงาน", icon: <CheckCircle size={16} /> },
              { id: "donators", label: "สายเปย์", icon: <DollarSign size={16} /> },
              { id: "activity", label: "สายบวก", icon: <Target size={16} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  position: "relative",
                  padding: "8px 24px",
                  borderRadius: "8px",
                  border: "none",
                  background: "transparent",
                  color: activeTab === tab.id ? "#fff" : "#64748b",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  zIndex: 1,
                  transition: "color 0.3s"
                }}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(201,162,39,0.2)",
                      borderRadius: "8px",
                      border: "1px solid rgba(201,162,39,0.5)",
                      zIndex: -1
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === "donators" && (
              <RankCard 
                title="สายเปย์ (Top Donators)" 
                icon={<DollarSign size={24} />} 
                dataList={data.topDonators} 
                valuePrefix="฿" 
              />
            )}
            {activeTab === "attendance" && (
              <RankCard 
                title="ขยันทำงาน (Top Attendance)" 
                icon={<CheckCircle size={24} />} 
                dataList={data.topAttendance} 
                valueSuffix=" ครั้ง" 
              />
            )}
            {activeTab === "activity" && (
              <RankCard 
                title="สายบวก (Top Activities)" 
                icon={<Target size={24} />} 
                dataList={data.topActivity} 
                valueSuffix=" ครั้ง" 
              />
            )}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
