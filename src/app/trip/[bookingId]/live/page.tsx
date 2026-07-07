"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { authFetch } from "@/lib/authFetch";
import RequireAuth from "@/components/auth/RequireAuth";
import Button from "@/components/ui/Button";
import { IconArrowLeft, IconMapPin, IconMessageCircle, IconPhone } from "@tabler/icons-react";
import type { Booking, DriverRoute } from "@/types";

interface LiveDetail {
  booking: Booking;
  route: DriverRoute | null;
  driver: { uid: string; name: string; rating: number; phone: string | null } | null;
  coRiders: { uid: string; name: string; rating: number }[];
}

function LiveContent() {
  const { firebaseUser } = useAuth();
  const router = useRouter();
  const params = useParams<{ bookingId: string }>();
  const [detail, setDetail] = useState<LiveDetail | null>(null);

  useEffect(() => {
    async function load() {
      const res = await authFetch(firebaseUser, `/api/bookings/${params.bookingId}`);
      if (res.ok) setDetail(await res.json());
    }
    load();
  }, [firebaseUser, params.bookingId]);

  if (!detail || !detail.route) {
    return <p className="p-6 text-center text-sm text-muted">Loading…</p>;
  }

  const { route, driver, coRiders } = detail;

  return (
    <div>
      <nav className="sticky top-0 z-20 flex h-nav items-center gap-3 bg-orange px-4 text-white">
        <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
          <IconArrowLeft size={18} />
        </button>
        <span className="flex-1 text-center text-base font-semibold">Ride in progress</span>
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
      </nav>

      <div className="bg-orange px-4 pb-6 text-white">
        <div className="mb-1 text-xl font-bold">
          {route.from} → {route.to}
        </div>
        <div className="text-sm opacity-85">
          With {driver?.name} {route.car && `· ${route.car.plate} · ${route.car.colour} ${route.car.model}`}
        </div>
      </div>

      <div className="flex h-[220px] flex-col items-center justify-center gap-2 border-b border-border bg-surface-alt text-muted">
        <IconMapPin size={44} />
        <p className="text-sm">Live map — shows your route progress</p>
      </div>

      <div className="flex flex-col gap-3 p-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-surface p-2.5">
            <div className="text-xs text-muted">ETA</div>
            <div className="font-bold text-orange">12 min</div>
          </div>
          <div className="rounded-lg bg-surface p-2.5">
            <div className="text-xs text-muted">Distance left</div>
            <div className="font-semibold">8.4 km</div>
          </div>
          <div className="rounded-lg bg-surface p-2.5">
            <div className="text-xs text-muted">Fare</div>
            <div className="font-bold text-green">₦{detail.booking.fare}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border p-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-light text-sm font-bold text-orange">
            {(driver?.name ?? "??").slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold">{driver?.name}</div>
            <div className="text-xs text-muted">★ {(driver?.rating ?? 5).toFixed(1)}</div>
          </div>
          <div className="flex flex-col gap-1.5">
            {driver?.phone ? (
              <a
                href={`tel:${driver.phone}`}
                className="rounded-lg border border-green-mid bg-green-light px-3 py-1.5 text-center text-xs font-medium text-green"
              >
                <IconPhone size={13} className="mr-1 inline" /> Call
              </a>
            ) : (
              <span className="rounded-lg border border-border px-3 py-1.5 text-center text-xs font-medium text-muted opacity-60">
                <IconPhone size={13} className="mr-1 inline" /> No number
              </span>
            )}
            <Link
              href={`/trip/${params.bookingId}/chat`}
              className="rounded-lg border border-border px-3 py-1.5 text-center text-xs font-medium text-muted"
            >
              <IconMessageCircle size={13} className="mr-1 inline" /> Chat
            </Link>
          </div>
        </div>

        {coRiders.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
              Co-riders
            </p>
            <div className="flex gap-2">
              {coRiders.map((r) => (
                <div
                  key={r.uid}
                  className="flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-light text-[10px] font-bold text-green">
                    {r.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium">{r.name.split(" ")[0]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="notice-box notice-orange text-[13px]">
          🚨 <strong>Safety:</strong> Share your trip status with a trusted
          contact before departure.
        </div>
        <Link href="/safety" className="w-full">
          <Button variant="ghost" full>
            Safety &amp; share trip status
          </Button>
        </Link>
        <Button
          variant="outline-orange"
          full
          onClick={() => router.push(`/trip/${params.bookingId}/rate`)}
        >
          End trip &amp; rate driver
        </Button>
      </div>
    </div>
  );
}

export default function RideLivePage() {
  return (
    <RequireAuth>
      <LiveContent />
    </RequireAuth>
  );
}
