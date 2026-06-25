import { Metadata } from "next";
import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import { Calendar, Clock, AlignLeft, ShieldAlert } from "lucide-react";
import Link from "next/link";

const typeColors: Record<string, string> = {
  event: "#c9a227",
  meeting: "#3b82f6",
  war: "#ef4444",
};

const typeLabels: Record<string, string> = {
  event: "กิจกรรม",
  meeting: "นัดประชุม",
  war: "ตีเมือง / วอร์",
};

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const event = await prisma.gangEvent.findUnique({
    where: { id: params.id }
  });

  if (!event) return { title: "Event Not Found" };

  const dateObj = new Date(event.startDate);
  const dateString = dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeString = dateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

  return {
    title: `${event.title} - SOG Gang Calendar`,
    description: `📅 ${dateString} เวลา ${timeString} น.\nประเภท: ${typeLabels[event.type] || "กิจกรรม"}\n${event.description || ""}`,
    openGraph: {
      title: `${event.title} - SOG Gang Calendar`,
      description: `📅 ${dateString} เวลา ${timeString} น.\nประเภท: ${typeLabels[event.type] || "กิจกรรม"}\n${event.description || ""}`,
    }
  };
}

export default async function EventSharePage({ params }: { params: { id: string } }) {
  const event = await prisma.gangEvent.findUnique({
    where: { id: params.id }
  });

  if (!event) notFound();

  const dateObj = new Date(event.startDate);
  const dateString = dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeString = dateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "linear-gradient(135deg, #0a0f1e 0%, #1a2235 100%)", color: "#f8fafc", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: "600px", width: "100%", margin: "40px auto", padding: "0 20px" }}>
        
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <h2 style={{ color: "#c9a227", margin: 0, fontSize: "1.5rem", fontWeight: 900 }}>SON OF GOD</h2>
          <div style={{ color: "#94a3b8", fontSize: "0.9rem", letterSpacing: "2px" }}>GANG CALENDAR</div>
        </div>

        <div style={{ background: "rgba(15,22,41,0.6)", backdropFilter: "blur(12px)", borderRadius: "16px", padding: "40px", border: "1px solid rgba(255,255,255,0.05)", borderTop: `4px solid ${typeColors[event.type] || typeColors.event}`, boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
            <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: 800, color: "#e2e8f0" }}>{event.title}</h1>
            <span style={{ padding: "6px 12px", background: "rgba(255,255,255,0.05)", borderRadius: "20px", color: typeColors[event.type] || typeColors.event, fontWeight: 700, fontSize: "0.9rem", whiteSpace: "nowrap" }}>
              {typeLabels[event.type] || "กิจกรรม"}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#e2e8f0", fontSize: "1.1rem" }}>
              <Calendar size={20} color="#94a3b8" /> {dateString}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#e2e8f0", fontSize: "1.1rem" }}>
              <Clock size={20} color="#94a3b8" /> {timeString} น.
            </div>
            {event.recurrence !== "none" && (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#c9a227", fontSize: "1rem" }}>
                <span style={{ width: "20px", textAlign: "center" }}>↻</span> ทำซ้ำ: {event.recurrence === "weekly" ? "รายสัปดาห์" : "รายเดือน"}
              </div>
            )}
            {event.description && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", color: "#cbd5e1", fontSize: "1rem", marginTop: "8px", background: "rgba(0,0,0,0.2)", padding: "16px", borderRadius: "12px" }}>
                <AlignLeft size={20} color="#94a3b8" style={{ marginTop: "2px", flexShrink: 0 }} /> 
                <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{event.description}</div>
              </div>
            )}
          </div>

          <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "12px", padding: "12px 16px", marginBottom: "24px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <ShieldAlert size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div style={{ color: "#f87171", fontSize: "0.9rem", lineHeight: 1.5 }}>
              ลิงก์นี้เป็นข้อมูลนัดหมายภายในแก๊งค์ SOG ห้ามส่งต่อให้บุคคลภายนอกโดยเด็ดขาด
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "24px" }}>
            <Link href="/calendar" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 24px", borderRadius: "12px", background: "linear-gradient(45deg, #c9a227, #eab308)", color: "#000", textDecoration: "none", fontWeight: 800 }}>
              เปิดในระบบแก๊งค์
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
