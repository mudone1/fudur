"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";

export default function LandingPage() {
  const { firebaseUser, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !firebaseUser) return;
    if (!profile?.name) {
      router.replace("/complete-profile");
    } else if (profile.type === "driver") {
      router.replace("/driver/dashboard");
    } else {
      router.replace("/rider/home");
    }
  }, [loading, firebaseUser, profile, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div>
        <h1 className="text-2xl font-bold">
          <span className="text-green">fu</span>
          <span className="text-orange">dur</span>
        </h1>
        <p className="mt-2 text-muted">Abuja&apos;s commuter rideshare</p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <Link href="/login" className="w-full">
          <Button variant="orange" full>
            Log in / Sign up
          </Button>
        </Link>
        <Link href="/driver/register" className="w-full">
          <Button variant="green" full>
            Become a partner driver
          </Button>
        </Link>
      </div>
    </div>
  );
}
