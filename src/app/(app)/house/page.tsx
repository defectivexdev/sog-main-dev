import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { Users, CheckCircle, XCircle, Home as HomeIcon, AlertCircle, Building, UsersIcon } from "lucide-react";
import { isManager } from "@/lib/roles";
import { redirect } from "next/navigation";
import EmptyState from "@/components/ui/EmptyState";

export default async function HouseDashboardPage({ searchParams }: { searchParams: Promise<{ houseId?: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");

  const me = await prisma.member.findUnique({ where: { discordId: session.user.discordId } });
  const manager = isManager(session.user.gangRole as any);

  const { houseId: qHouseId } = await searchParams;

  // If not manager and not in a house, deny
  if (!manager && !me?.houseId) {
    return (
      <div style={{ padding: "40px 0" }}>
        <EmptyState title="ไม่มีสังกัดบ้าน" description="คุณไม่ได้สังกัดบ้านใดๆ ในขณะนี้ กรุณาติดต่อผู้จัดการเพื่อเข้าบ้าน" icon={<Building size={36} />} />
      </div>
    );
  }

  // Fetch settings for weekly tax
  const settings = await prisma.settings.findUnique({ where: { id: "global" } }) || { weeklyTaxAmount: 0 };
  const taxRequired = settings.weeklyTaxAmount;

  // Determine which house to show
  let targetHouseId = manager ? (qHouseId || me?.houseId) : me?.houseId;
  
  // Fetch houses list for manager dropdown
  const allHouses = manager ? await prisma.house.findMany({ orderBy: { name: 'asc' } }) : [];

  if (manager && !targetHouseId && allHouses.length > 0) {
    targetHouseId = allHouses[0].id;
  }

  if (!targetHouseId) {
    return (
      <div style={{ padding: "40px 0" }}>
        <EmptyState title="ไม่พบบ้านในระบบ" description="ยังไม่มีบ้านใดๆ ถูกสร้างขึ้นในระบบ กรุณาสร้างบ้านก่อน" icon={<Building size={36} />} />
      </div>
    );
  }

  const house = await prisma.house.findUnique({
    where: { id: targetHouseId },
    include: {
      members: {
        where: { status: "active" }
      }
    }
  });

  if (!house) {
    return (
      <div style={{ padding: "40px 0" }}>
        <EmptyState title="ข้อมูลบ้านไม่ถูกต้อง" description="ไม่พบข้อมูลของบ้านที่เลือก หรือบ้านอาจถูกลบไปแล้ว" icon={<AlertCircle size={36} />} />
      </div>
    );
  }

  // Get start of the current week (Monday)
  const today = new Date();
  const day = today.getDay(); // 0 is Sunday, 1 is Monday
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const startOfWeek = new Date(today.setDate(diff));
  startOfWeek.setHours(0, 0, 0, 0);

  // Fetch all confirmed income payments for members in this house THIS WEEK
  const memberIds = house.members.map((m: any) => m.icName || m.name);
  
  // Note: Payments store memberName, not ID (based on existing schema usage).
  // We need to map them carefully.
  const payments = await prisma.payment.groupBy({
    by: ['memberName'],
    _sum: { amount: true },
    where: {
      type: "income",
      status: "confirmed",
      date: { gte: startOfWeek },
      memberName: { in: memberIds }
    }
  });

  const paymentMap = new Map();
  payments.forEach((p: any) => {
    paymentMap.set(p.memberName, p._sum.amount || 0);
  });

  const memberStats = house.members.map((m: any) => {
    const nameToMatch = m.icName || m.name;
    const paid = paymentMap.get(nameToMatch) || 0;
    const isPaid = paid >= taxRequired;
    const debt = isPaid ? 0 : taxRequired - paid;
    return { ...m, paid, isPaid, debt, nameToMatch };
  });

  // Sort: unpaid first, then paid
  memberStats.sort((a: any, b: any) => Number(a.isPaid) - Number(b.isPaid));

  // Cannot use framer-motion directly in Server Components as it needs 'use client'.
  // Oh wait, /house/page.tsx is a Server Component. I cannot use `framer-motion` `<motion.div>` directly unless I create a client wrapper.
  // Instead, I'll use simple CSS transitions for hover effects.
  
  return (
    <div className="animate-fade-in" style={{ paddingBottom: "40px" }}>
      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
            <HomeIcon size={32} color="#c9a227" /> ข้อมูลบ้าน: {house.name}
          </h1>
          <p className="page-subtitle" style={{ margin: "4px 0 0" }}>
            ยอดส่วยประจำสัปดาห์: <strong style={{ color: "#34d399" }}>฿{taxRequired.toLocaleString()}</strong> / คน
          </p>
        </div>

        {manager && (
          <form style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>เปลี่ยนบ้าน:</span>
            <select 
              name="houseId" 
              defaultValue={house.id}
              className="sog-input" 
              style={{ width: "200px", padding: "8px 12px" }}
              onChange={(e) => e.target.form?.submit()}
            >
              {allHouses.map((h: any) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </form>
        )}
      </div>

      <div className="glass-card" style={{ padding: "24px" }}>
        <h2 style={{ color: "#e2e8f0", fontSize: "1.2rem", fontWeight: 700, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Users size={20} color="#3b82f6" /> ลูกบ้าน ({memberStats.length} คน)
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
          {memberStats.map((m: any) => (
            <div 
              key={m.id} 
              className="hover-card-effect"
              style={{ 
                background: "rgba(15,22,41,0.5)", 
                padding: "16px", 
                borderRadius: "12px", 
                border: `1px solid ${m.isPaid ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                transition: "all 0.3s ease",
              }}
            >
              <div>
                <p style={{ color: "#e2e8f0", fontWeight: 700, margin: "0 0 4px", fontSize: "1.05rem" }}>{m.nameToMatch}</p>
                <p style={{ color: "#94a3b8", fontSize: "0.8rem", margin: 0 }}>
                  ยอดส่งสัปดาห์นี้: <strong style={{ color: "#fff" }}>฿{m.paid.toLocaleString()}</strong>
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                {m.isPaid ? (
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#34d399", fontSize: "0.85rem", fontWeight: 700, background: "rgba(52,211,153,0.1)", padding: "4px 8px", borderRadius: "12px" }}>
                    <CheckCircle size={14} /> ครบแล้ว
                  </span>
                ) : (
                  <>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#f87171", fontSize: "0.85rem", fontWeight: 700, background: "rgba(248,113,113,0.1)", padding: "4px 8px", borderRadius: "12px" }}>
                      <XCircle size={14} /> ยังไม่ครบ
                    </span>
                    <span style={{ color: "#f87171", fontSize: "0.75rem" }}>
                      ขาด ฿{m.debt.toLocaleString()}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}

          {memberStats.length === 0 && (
            <div style={{ gridColumn: "1/-1" }}>
              <EmptyState title="ยังไม่มีลูกบ้าน" description="ยังไม่มีสมาชิกสังกัดอยู่ในบ้านนี้" icon={<UsersIcon size={36} />} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
