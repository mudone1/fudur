import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "Fudur — Abuja Commuter Rideshare",
  description: "Find and share commuter rides across Abuja.",
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
        </AuthProvider>
      </body>
    </html>
  );
}
