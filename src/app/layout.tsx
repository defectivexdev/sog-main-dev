import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";
import SessionWrapper from "@/components/SessionWrapper";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "SOG Gang — Son of God",
  description: "ระบบจัดการแก๊งค์ SOG — Son of God",
  icons: { 
    icon: "/sog-logo.png",
    apple: "/icon-192x192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0F1629",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "";
  const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);

  return (
    <html lang="th" data-scroll-behavior="smooth">
      <head>
        {isMobile && <link rel="manifest" href="/manifest.json" />}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SOG Gang" />
      </head>
      <body className="bg-animate min-h-screen">
        <Toaster 
          position="bottom-right" 
          toastOptions={{ 
            style: { 
              background: 'rgba(15, 22, 41, 0.9)', 
              color: '#e2e8f0',
              border: '1px solid rgba(201, 162, 39, 0.3)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
            },
            className: 'sog-toast'
          }} 
        />
        <SessionWrapper>{children}</SessionWrapper>
      </body>
    </html>
  );
}
