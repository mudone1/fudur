"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import RequireAuth from "@/components/auth/RequireAuth";
import TopNav from "@/components/layout/TopNav";
import Button from "@/components/ui/Button";
import NotificationSettings from "@/components/ui/NotificationSettings";
import { useAuth } from "@/contexts/AuthContext";
import {
  IconChevronRight,
  IconShieldCheck,
  IconHeart,
  IconTrophy,
  IconMapPin,
} from "@tabler/icons-react";

const LINKS = [
  { href: "/safety", label: "Safety centre", Icon: IconShieldCheck, color: "text-orange" },
  { href: "/rider/favourites", label: "Favourite drivers", Icon: IconHeart, color: "text-orange" },
  { href: "/rider/saved-routes", label: "Saved routes", Icon: IconMapPin, color: "text-orange" },
  { href: "/leaderboard", label: "Rankings", Icon: IconTrophy, color: "text-orange" },
];

function ProfileContent() {
  const { profile, logout } = useAuth();
  const router = useRouter();

  return (
    <div>
      <TopNav title="Profile" />
      <div className="border-b border-border p-7 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-orange-light text-lg font-semibold text-orange">
          {profile?.name?.slice(0, 2).toUpperCase() ?? "?"}
        </div>
        <h2 className="text-lg font-bold">{profile?.name}</h2>
        <p className="text-sm text-muted">{profile?.email}</p>
        <p className="text-sm text-muted">{profile?.area}</p>
      </div>
      <div className="flex flex-col gap-3 p-4">
        <NotificationSettings />
        {LINKS.map(({ href, label, Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-xl border border-border p-3.5"
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-full bg-orange-light ${color}`}>
              <Icon size={18} />
            </div>
            <span className="flex-1 text-sm font-bold">{label}</span>
            <IconChevronRight size={16} className="text-muted" />
          </Link>
        ))}
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
    </div>
  );
}

export default function RiderProfilePage() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}
