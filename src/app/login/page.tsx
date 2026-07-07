"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import TopNav from "@/components/layout/TopNav";
import Button from "@/components/ui/Button";
import { IconBrandGoogle } from "@tabler/icons-react";

export default function LoginPage() {
  const { firebaseUser, profile, loading, authBusy, error, signInWithGoogle } =
    useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !firebaseUser) return;
    if (!profile?.name) {
      router.replace("/complete-profile");
    } else {
      router.replace(profile.type === "driver" ? "/driver/dashboard" : "/rider/home");
    }
  }, [loading, firebaseUser, profile, router]);

  return (
    <div>
      <TopNav title="Log in" />
      <div className="px-4 pt-14 pb-7 text-center">
        <div className="mb-3 text-4xl">👋</div>
        <h2 className="text-xl font-bold">Welcome to fudur</h2>
        <p className="text-sm text-muted">
          Sign in with Google to book or offer rides
        </p>
      </div>

      <div className="flex flex-col gap-4 px-4">
        {error && (
          <div className="rounded-[10px] border border-[#E24B4A] bg-[#FFF0F0] px-3.5 py-3 text-sm text-[#C83030]">
            {error}
          </div>
        )}

        <Button
          variant="orange"
          full
          loading={authBusy}
          onClick={signInWithGoogle}
          className="text-base"
        >
          <IconBrandGoogle size={18} />
          {authBusy ? "Signing in…" : "Continue with Google"}
        </Button>

        <p className="text-center text-[13px] text-muted">
          New here? Signing in with Google creates your account automatically
          — you&apos;ll finish setup on the next screen.
        </p>
      </div>
    </div>
  );
}
