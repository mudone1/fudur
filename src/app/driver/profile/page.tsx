"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import RequireAuth from "@/components/auth/RequireAuth";
import TopNav from "@/components/layout/TopNav";
import DriverBottomNav from "@/components/layout/DriverBottomNav";
import Button from "@/components/ui/Button";
import NotificationSettings from "@/components/ui/NotificationSettings";
import { useAuth } from "@/contexts/AuthContext";
import { IconChevronRight, IconShieldCheck } from "@tabler/icons-react";

function ProfileContent() {
  const { profile, logout } = useAuth();
  const router = useRouter();

  return (
    <div className="pb-24">
      <TopNav title="Profile" showBack={false} />
      <div className="border-b border-border p-7 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-light text-lg font-semibold text-green">
          {profile?.name?.slice(0, 2).toUpperCase() ?? "?"}
        </div>
        <h2 className="text-lg font-bold">{profile?.name}</h2>
        <p className="text-sm text-muted">{profile?.phone}</p>
        <p className="text-sm text-muted">{profile?.area}</p>
      </div>
      <div className="flex flex-col gap-3 p-4">
        <NotificationSettings />
        <Link
          href="/safety"
          className="flex items-center gap-3 rounded-xl border border-border p-3.5"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-light text-orange">
            <IconShieldCheck size={18} />
          </div>
          <span className="flex-1 text-sm font-bold">Safety centre</span>
          <IconChevronRight size={16} className="text-muted" />
        </Link>
        <Button
          variant="ghost"
          full
          onClick={async () => {
            await logout();
            router.replace("/login");
          }}
        >
          Log out
        </Button>
      </div>
      <DriverBottomNav />
    </div>
  );
}

export default function DriverProfilePage() {
  return (
    <RequireAuth driverOnly>
      <ProfileContent />
    </RequireAuth>
  );
}
