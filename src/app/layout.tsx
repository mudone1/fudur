import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import InstallPrompt from "@/components/ui/InstallPrompt";

export const metadata: Metadata = {
  title: "Fudur — Abuja Commuter Rideshare",
  description: "Find and share commuter rides across Abuja.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Fudur",
  },
};

export const viewport: Viewport = {
  themeColor: "#F05A00",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="container-app min-h-screen">{children}</div>
          <InstallPrompt />
        </AuthProvider>
      </body>
    </html>
  );
}
