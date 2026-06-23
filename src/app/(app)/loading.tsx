export default function Loading() {
  return (
    <div className="animate-fade-in" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header Skeleton */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <div style={{ width: "300px", height: "36px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} />
        <div style={{ width: "150px", height: "20px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} />
      </div>

      {/* Stats Grid Skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="glass-card" style={{ height: "110px", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(255,255,255,0.08)" }} />
              <div style={{ width: "60%", height: "16px", borderRadius: "4px", background: "rgba(255,255,255,0.08)" }} />
            </div>
            <div style={{ width: "40%", height: "28px", borderRadius: "6px", background: "rgba(255,255,255,0.1)" }} />
          </div>
        ))}
      </div>

      {/* Lower Section Skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px", marginTop: "16px" }}>
        {[1, 2].map((i) => (
          <div key={i} className="glass-card" style={{ height: "300px", padding: "20px", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }}>
            <div style={{ width: "40%", height: "24px", borderRadius: "6px", background: "rgba(255,255,255,0.08)", marginBottom: "20px" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[1, 2, 3].map((j) => (
                <div key={j} style={{ width: "100%", height: "50px", borderRadius: "8px", background: "rgba(255,255,255,0.05)" }} />
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      `}</style>
    </div>
  );
}
