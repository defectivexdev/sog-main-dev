import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { Users, ClipboardList, CheckCircle, Gift, ShoppingCart, Gamepad2, DollarSign, Crown } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import DashboardWidgets from "@/components/DashboardWidgets";
import TopRightClock from "@/components/ui/TopRightClock";
import Image from "next/image";

export default async function DashboardPage() {
  const session = await auth();
  const displayName = session?.user?.icName || session?.user?.name?.split(" ")[0] || "สมาชิก";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);

  // 1. Fetch Stats
  const [
    totalMembers,
    pendingLeaves,
    todayAttendance,
    openAirdrops,
    pendingRequisitions,
    upcomingActivities
  ] = await Promise.all([
    prisma.member.count({ where: { status: "active" } }),
    prisma.leave.count({ where: { status: "pending" } }),
    prisma.attendance.count({ where: { date: { gte: today } } }),
    prisma.airdrop.count({ where: { status: "open" } }),
    prisma.requisition.count({ where: { status: "pending" } }),
    prisma.activity.count({ where: { status: "upcoming" } }),
  ]);

  // 2. Fetch Financial Data for Chart
  const payments = await prisma.payment.findMany({
    where: { 
      status: "confirmed",
      date: { gte: sevenDaysAgo }
    }
  });

  // Group financial data by date
  const chartDataMap: Record<string, { income: number; expense: number }> = {};
  
  // Initialize last 7 days
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const dateStr = d.toLocaleDateString("th-TH", { day: 'numeric', month: 'short' });
    chartDataMap[dateStr] = { income: 0, expense: 0 };
  }

  payments.forEach((p: any) => {
    const dateStr = new Date(p.date).toLocaleDateString("th-TH", { day: 'numeric', month: 'short' });
    if (chartDataMap[dateStr]) {
      if (p.type === "income") chartDataMap[dateStr].income += p.amount;
      else chartDataMap[dateStr].expense += p.amount;
    }
  });

  const chartData = Object.keys(chartDataMap).map(date => ({
    date,
    income: chartDataMap[date].income,
    expense: chartDataMap[date].expense
  }));

  // 3. Fetch Activity Feed Data & New Widgets Data
  const [
    recentLeaves, 
    recentReqs, 
    recentPays, 
    latestAnnouncementRaw,
    upcomingActivitiesList,
    topEarnersRaw,
    activeLeaves,
    recentAirdrops
  ] = await Promise.all([
    prisma.leave.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
    prisma.requisition.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
    prisma.payment.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
    prisma.announcement.findFirst({ orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }] }),
    // Upcoming Events
    prisma.activity.findMany({
      where: { status: 'upcoming', date: { gte: today } },
      orderBy: { date: 'asc' },
      take: 4
    }),
    // Top Earners (Past 7 days)
    prisma.payment.groupBy({
      by: ['memberName'],
      _sum: { amount: true },
      where: { type: 'income', status: 'confirmed', date: { gte: sevenDaysAgo } },
      orderBy: { _sum: { amount: 'desc' } },
      take: 3
    }),
    // Active Leaves (Today)
    prisma.leave.findMany({
      where: {
        status: 'approved',
        startDate: { lte: new Date(today.getTime() + 86400000) },
        endDate: { gte: today }
      },
      select: { memberName: true, reason: true }
    }),
    // Recent closed airdrops for Loot Gallery
    prisma.airdrop.findMany({
      where: { status: 'closed' },
      orderBy: { date: 'desc' },
      take: 2,
      select: { sessionName: true, items: true, date: true }
    })
  ]);

  const topEarners = topEarnersRaw.map(e => ({ name: e.memberName, amount: e._sum.amount || 0 }));
  const airdropLoot = recentAirdrops.map(a => ({
    sessionName: a.sessionName,
    date: a.date,
    items: a.items as any[]
  })).filter(a => a.items && a.items.length > 0);

  let activities: ActivityItem[] = [];
  
  recentLeaves.forEach(l => activities.push({
    id: `leave-${l.id}`,
    type: "leave",
    title: `แจ้งลา: ${l.reason}`,
    user: l.memberName,
    timestamp: l.createdAt,
    status: l.status
  }));

  recentReqs.forEach(r => activities.push({
    id: `req-${r.id}`,
    type: "requisition",
    title: `เบิก: ${r.itemName} (${r.quantity}${r.unit || 'ชิ้น'})`,
    user: r.memberName,
    timestamp: r.createdAt,
    status: r.status
  }));

  recentPays.forEach(p => activities.push({
    id: `pay-${p.id}`,
    type: p.type === "income" ? "payment_income" : "payment_expense",
    title: p.type === "income" ? "ส่งเงินเข้าคลัง" : "เบิกเงิน",
    user: p.memberName,
    timestamp: p.createdAt,
    status: p.status,
    amount: p.amount
  }));

  // Sort combined activities by time desc and take top 5
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  activities = activities.slice(0, 5);

  // Static configs
  const stats = [
    { label: "สมาชิกทั้งหมด", value: totalMembers, icon: <Users size={28} />, color: "#5865f2" },
    { label: "เช็คชื่อวันนี้", value: todayAttendance, icon: <CheckCircle size={28} />, color: "#10b981" },
    { label: "ลารอดำเนินการ", value: pendingLeaves, icon: <ClipboardList size={28} />, color: "#f87171" },
    { label: "เบิกของรอดำเนินการ", value: pendingRequisitions, icon: <ShoppingCart size={28} />, color: "#8b5cf6" },
    { label: "แอร์ดรอปเปิดอยู่", value: openAirdrops, icon: <Gift size={28} />, color: "#f59e0b" },
    { label: "กิจกรรมที่กำลังมา", value: upcomingActivities, icon: <Gamepad2 size={28} />, color: "#ec4899" },
  ];

  const quickLinks = [
    { label: "แจ้งลา", href: "/leave", icon: <ClipboardList size={24} />, desc: "บันทึกการลาของสมาชิก" },
    { label: "เช็คชื่อ", href: "/attendance", icon: <CheckCircle size={24} />, desc: "บันทึกการเข้าร่วม" },
    { label: "เบิกของ", href: "/requisition", icon: <ShoppingCart size={24} />, desc: "ขอเบิกสินค้า" },
    { label: "ส่งเงิน", href: "/payment", icon: <DollarSign size={24} />, desc: "บันทึกการส่งเงิน" },
  ];

  const latestAnnouncement = latestAnnouncementRaw;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: "10px" }}>
      {/* Header */}
      <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="page-title" style={{ margin: 0, fontSize: "2rem", fontWeight: 800 }}>
          ยินดีต้อนรับ, {displayName} 👋
        </h1>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ background: "rgba(255,255,255,0.05)", padding: "6px 12px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#34d399", boxShadow: "0 0 10px #34d399" }}></div>
            ระบบออนไลน์
          </div>
          <TopRightClock />
        </div>
      </div>

      {/* Latest Announcement */}
      {latestAnnouncement && (
        <div className="glass-card" style={{ padding: "12px 20px", marginBottom: "16px", borderLeft: "4px solid #c9a227", background: "linear-gradient(90deg, rgba(201,162,39,0.1) 0%, rgba(15,22,41,0.5) 100%)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <h3 style={{ color: "#c9a227", fontWeight: 800, fontSize: "1rem", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              📢 {latestAnnouncement.title}
            </h3>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{new Date(latestAnnouncement.createdAt).toLocaleDateString("th-TH", { day: 'numeric', month: 'short' })}</span>
          </div>
          <p style={{ color: "#e2e8f0", fontSize: "0.85rem", margin: "4px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {latestAnnouncement.content}
          </p>
        </div>
      )}

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px", marginBottom: "16px" }}>
        {stats.map((stat, i) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} color={stat.color} delay={i * 0.05} />
        ))}
      </div>

      {/* Dashboard Interactive Widgets (Chart & Timeline) */}
      <DashboardWidgets />

      {/* Main Grid removed as requested by user */}

      {/* Quick Actions removed as requested */}

      {/* --- NEW PREMIUM WIDGETS --- */}
      <div style={{ marginTop: "24px" }}>
        <h2 style={{ color: "#c9a227", fontSize: "1.1rem", fontWeight: 800, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Crown size={20} /> <span className="gradient-gold">ศูนย์รวมข้อมูลแก๊งค์</span>
        </h2>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
          
          {/* 1. Top Earners Leaderboard */}
          <div className="glass-card" style={{ padding: "20px", display: "flex", flexDirection: "column" }}>
            <h3 style={{ color: "#e2e8f0", fontSize: "1rem", fontWeight: 700, margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Crown size={18} color="#c9a227" /> Top Spenders 7 วันล่าสุด
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
              {topEarners.length === 0 ? (
                <div style={{ color: "#64748b", textAlign: "center", padding: "20px 0", fontSize: "0.85rem" }}>ไม่มีข้อมูลรายรับ</div>
              ) : (
                topEarners.map((earner, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(15,22,41,0.5)", padding: "12px", borderRadius: "10px", border: "1px solid rgba(201,162,39,0.1)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: idx === 0 ? "rgba(201,162,39,0.2)" : "rgba(255,255,255,0.05)", color: idx === 0 ? "#c9a227" : "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.9rem" }}>
                        {idx + 1}
                      </div>
                      <span style={{ color: "#e2e8f0", fontWeight: 600, fontSize: "0.9rem" }}>{earner.name}</span>
                    </div>
                    <span style={{ color: "#34d399", fontWeight: 700, fontSize: "0.9rem" }}>฿{earner.amount.toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 2. Upcoming Events */}
          <div className="glass-card" style={{ padding: "20px", display: "flex", flexDirection: "column" }}>
            <h3 style={{ color: "#e2e8f0", fontSize: "1rem", fontWeight: 700, margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Gamepad2 size={18} color="#ec4899" /> ตารางกิจกรรมที่กำลังจะมาถึง
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
              {upcomingActivitiesList.length === 0 ? (
                <div style={{ color: "#64748b", textAlign: "center", padding: "20px 0", fontSize: "0.85rem" }}>ไม่มีกิจกรรมที่กำลังจะมาถึง</div>
              ) : (
                upcomingActivitiesList.map((act, idx) => (
                  <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "6px", background: "rgba(236,72,153,0.05)", padding: "12px", borderRadius: "10px", border: "1px solid rgba(236,72,153,0.15)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <span style={{ color: "#e2e8f0", fontWeight: 600, fontSize: "0.9rem" }}>{act.name}</span>
                      <span style={{ color: "#ec4899", fontWeight: 700, fontSize: "0.8rem", background: "rgba(236,72,153,0.1)", padding: "2px 8px", borderRadius: "12px" }}>
                        {new Date(act.date).toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit' })} น.
                      </span>
                    </div>
                    <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>📅 {new Date(act.date).toLocaleDateString("th-TH", { day: 'numeric', month: 'long' })}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 3. Daily Roster */}
          <div className="glass-card" style={{ padding: "20px", display: "flex", flexDirection: "column" }}>
            <h3 style={{ color: "#e2e8f0", fontSize: "1rem", fontWeight: 700, margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Users size={18} color="#3b82f6" /> สถานะกำลังพลวันนี้
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(59,130,246,0.05)", padding: "12px", borderRadius: "10px", border: "1px solid rgba(59,130,246,0.15)" }}>
                <div>
                  <p style={{ color: "#94a3b8", fontSize: "0.75rem", margin: "0 0 4px" }}>พร้อมรบ (เช็คชื่อแล้ว)</p>
                  <p style={{ color: "#34d399", fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>{todayAttendance} คน</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ color: "#94a3b8", fontSize: "0.75rem", margin: "0 0 4px" }}>ลางาน (วันนี้)</p>
                  <p style={{ color: "#f87171", fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>{activeLeaves.length} คน</p>
                </div>
              </div>
              
              {activeLeaves.length > 0 && (
                <div style={{ marginTop: "4px" }}>
                  <p style={{ color: "#64748b", fontSize: "0.8rem", marginBottom: "8px" }}>รายชื่อคนลา:</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {activeLeaves.map((l, idx) => (
                      <span key={idx} style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", padding: "4px 8px", borderRadius: "6px", fontSize: "0.75rem", border: "1px solid rgba(248,113,113,0.2)" }}>
                        {l.memberName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4. Recent Loot Gallery */}
          <div className="glass-card" style={{ padding: "20px", display: "flex", flexDirection: "column" }}>
            <h3 style={{ color: "#e2e8f0", fontSize: "1rem", fontWeight: 700, margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Gift size={18} color="#f59e0b" /> แกลเลอรีของที่ปล้นได้ (ล่าสุด)
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1, overflowY: "auto" }}>
              {airdropLoot.length === 0 ? (
                <div style={{ color: "#64748b", textAlign: "center", padding: "20px 0", fontSize: "0.85rem" }}>ยังไม่มีข้อมูลแอร์ดรอป/ลูป</div>
              ) : (
                airdropLoot.map((drop, idx) => (
                  <div key={idx} style={{ marginBottom: "8px" }}>
                    <p style={{ color: "#f59e0b", fontSize: "0.85rem", fontWeight: 600, margin: "0 0 8px" }}>{drop.sessionName}</p>
                    <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
                      {drop.items.filter((i: any) => i.imageUrl).length > 0 ? (
                        drop.items.map((item: any, iIdx: number) => item.imageUrl && (
                          <div key={iIdx} style={{ flexShrink: 0, position: "relative" }}>
                            <Image src={item.imageUrl} alt={item.name} width={60} height={60} style={{ borderRadius: "8px", objectFit: "cover", border: "1px solid rgba(245,158,11,0.2)" }} />
                            <div style={{ position: "absolute", bottom: "-6px", right: "-6px", background: "#f59e0b", color: "#000", fontSize: "0.65rem", fontWeight: 800, padding: "2px 6px", borderRadius: "10px", border: "2px solid #0f1629" }}>
                              x{item.quantity}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ color: "#64748b", fontSize: "0.75rem", fontStyle: "italic" }}>ไม่มีรูปภาพในรอบนี้</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
