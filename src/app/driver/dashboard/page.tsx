"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import RequireAuth from "@/components/auth/RequireAuth";
import DriverBottomNav from "@/components/layout/DriverBottomNav";
import { useDriverEarnings } from "@/lib/hooks/useDriverEarnings";
import {
  IconChartBar,
  IconBell,
  IconTrophy,
  IconShieldCheck,
  IconRoute,
  IconPlus,
} from "@tabler/icons-react";
import type { DriverRoute } from "@/types";

function DashboardContent() {
  const { profile, firebaseUser } = useAuth();
  const { summary } = useDriverEarnings();
  const [routes, setRoutes] = useState<DriverRoute[]>([]);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    async function loadRoutes() {
      if (!firebaseUser) return;
      const idToken = await firebaseUser.getIdToken();
      const res = await fetch("/api/driver/routes", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRoutes(data.routes);
      }
    }
    loadRoutes();
  }, [firebaseUser]);

  const firstName = profile?.name?.split(" ")[0] ?? "there";

  return (
    <div className="pb-24">
      <div className="bg-gradient-to-br from-green to-green-dark px-4 py-6 text-white">
        <div className="mb-1 flex items-start justify-between">
          <div>
            <div className="text-sm opacity-80">Good morning, {firstName} 👋</div>
            <h2 className="text-xl font-bold">Partner dashboard</h2>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/25 text-base font-semibold">
            {firstName.slice(0, 2).toUpperCase()}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-bold">
              ₦{(summary?.today ?? 0).toLocaleString()}
            </div>
            <div className="text-[11px] opacity-80">Today</div>
          </div>
          <div>
            <div className="text-lg font-bold">
              ₦{(summary?.thisWeek ?? 0).toLocaleString()}
            </div>
            <div className="text-[11px] opacity-80">This week</div>
          </div>
          <div>
            <div className="text-lg font-bold">
              {(summary?.avgRating ?? profile?.rating ?? 5).toFixed(1)} ★
            </div>
            <div className="text-[11px] opacity-80">Rating</div>
          </div>
        </div>
      </div>

      <div className="mx-4 mt-4 flex items-center justify-between rounded-xl border border-border p-3.5">
        <div>
          <h4 className="text-sm font-bold">Available for rides</h4>
          <p className="text-xs text-muted">Turn off to pause bookings</p>
        </div>
        <button
          role="switch"
          aria-checked={online}
          onClick={() => setOnline((v) => !v)}
          className={`relative h-7 w-12 rounded-full transition-colors ${
            online ? "bg-green" : "bg-border"
          }`}
        >
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
              online ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      <div className="mx-4 my-4 grid grid-cols-4 gap-2">
        <Link
          href="/driver/earnings"
          className="flex flex-col items-center gap-1 rounded-xl bg-surface p-3 text-center"
        >
          <IconChartBar size={24} className="text-green" />
          <span className="text-[11px] font-medium text-muted">Earnings</span>
        </Link>
        <Link
          href="/driver/notifications"
          className="flex flex-col items-center gap-1 rounded-xl bg-surface p-3 text-center"
        >
          <IconBell size={24} className="text-green" />
          <span className="text-[11px] font-medium text-muted">Alerts</span>
        </Link>
        <div className="flex flex-col items-center gap-1 rounded-xl bg-surface p-3 text-center opacity-60">
          <IconTrophy size={24} className="text-orange" />
          <span className="text-[11px] font-medium text-muted">Rankings</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-xl bg-surface p-3 text-center opacity-60">
          <IconShieldCheck size={24} className="text-green" />
          <span className="text-[11px] font-medium text-muted">Safety</span>
        </div>
      </div>

      <div className="mx-4">
        <h3 className="mb-2 text-base font-bold">My posted routes</h3>
        {routes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted">
            No routes posted yet.
          </div>
        ) : (
          routes.map((r) => (
            <div
              key={r.id}
              className="mb-2 flex items-center gap-3 rounded-xl border border-border p-3"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px] bg-green-light">
                <IconRoute size={20} className="text-green" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">
                  {r.from} → {r.to}
                </div>
                <div className="text-xs text-muted">
                  {r.days.join(", ")} · {r.departureTime} · {r.seats} seats ·
                  ₦{r.pricePerSeat}/seat
                </div>
                <div className="text-xs text-muted">
                  Meeting: {r.meetingPoint}
                </div>
              </div>
            </div>
          ))
        )}
        <button className="mt-1 flex w-full items-center justify-center gap-2 rounded-fudur border border-green py-3 text-sm font-medium text-green">
          <IconPlus size={16} /> Add another route
        </button>
      </div>

      <DriverBottomNav />
    </div>
  );
}

export default function DriverDashboardPage() {
  return (
    <RequireAuth driverOnly>
      <DashboardContent />
    </RequireAuth>
  );
}
