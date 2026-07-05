"use client";

import { useRouter } from "next/navigation";
import RequireAuth from "@/components/auth/RequireAuth";
import TopNav from "@/components/layout/TopNav";
import DriverBottomNav from "@/components/layout/DriverBottomNav";
import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";

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
      <div className="p-4">
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
