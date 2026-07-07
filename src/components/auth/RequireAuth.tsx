"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function RequireAuth({
  children,
  driverOnly = false,
}: {
  children: React.ReactNode;
  driverOnly?: boolean;
}) {
  const { firebaseUser, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!firebaseUser) {
      router.replace("/login");
      return;
    }
    if (firebaseUser && !profile?.name) {
      router.replace("/complete-profile");
      return;
    }
    if (driverOnly && profile && profile.type !== "driver") {
      router.replace("/");
    }
  }, [loading, firebaseUser, profile, driverOnly, router]);

  if (loading || !firebaseUser || !profile?.name) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
