"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import TopNav from "@/components/layout/TopNav";
import RegisterWizard from "@/components/driver/RegisterWizard";

export default function DriverRegisterPage() {
  const { firebaseUser, loading } = useAuth();
  const router = useRouter();

  // Driver registration needs a verified phone number (our only auth
  // mechanism), so send unauthenticated visitors to log in first.
  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.replace("/login");
    }
  }, [loading, firebaseUser, router]);

  if (loading || !firebaseUser) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        Loading…
      </div>
    );
  }

  return (
    <div className="pb-10">
      <TopNav title="Become a partner driver" />
      <RegisterWizard />
    </div>
  );
}
