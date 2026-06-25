import Navbar from "@/components/Navbar";
import AnnouncementPopup from "@/components/AnnouncementPopup";
import CommandPalette from "@/components/CommandPalette";
import PageTransition from "@/components/PageTransition";
import { Toaster } from 'sonner';
import OnlineTracker from "@/components/OnlineTracker";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Navbar />
      <main
        style={{
          marginLeft: "292px",
          flex: 1,
          padding: "32px",
          minHeight: "100vh",
        }}
        className="app-main"
      >
        <PageTransition>
          {children}
        </PageTransition>
      </main>
      <AnnouncementPopup />
      <CommandPalette />
      <Toaster theme="dark" position="top-center" />
      <OnlineTracker />
    </div>
  );
}
