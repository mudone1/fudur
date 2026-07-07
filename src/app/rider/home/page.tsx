"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { authFetch } from "@/lib/authFetch";
import RequireAuth from "@/components/auth/RequireAuth";
import {
  IconMap2,
  IconHeart,
  IconTrophy,
  IconShield,
  IconMessageCircle,
  IconPhone,
  IconCheck,
} from "@tabler/icons-react";

interface CurrentBooking {
  booking: { id: string; fare: number };
  route: { from: string; to: string; departureTime: string } | null;
  driver: { name: string; phone: string | null } | null;
  seatsFilled: number;
}

interface TripHistoryItem {
  id: string;
  route: string;
  fare: number;
  driverName: string;
  dateLabel: string;
}

function HomeContent() {
  const { firebaseUser, profile } = useAuth();
  const router = useRouter();
  const [current, setCurrent] = useState<CurrentBooking | null>(null);
  const [history, setHistory] = useState<TripHistoryItem[]>([]);

  useEffect(() => {
    async function load() {
      const [curRes, histRes] = await Promise.all([
        authFetch(firebaseUser, "/api/bookings/current"),
        authFetch(firebaseUser, "/api/trips/history"),
      ]);
      if (curRes.ok) {
        const data = await curRes.json();
        setCurrent(data.booking ? data : null);
      }
      if (histRes.ok) {
        const data = await histRes.json();
        setHistory(data.trips ?? []);
      }
    }
    load();
  }, [firebaseUser]);

  const firstName = profile?.name?.split(" ")[0] ?? "there";

  return (
    <div>
      <div className="flex items-center justify-between px-4 pt-3">
        <Link href="/" className="text-sm font-bold">
          <span className="text-green">fu</span>
          <span className="text-orange">dur</span>
        </Link>
        <Link
          href="/rider/profile"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-xs font-bold text-muted"
        >
          {(profile?.name ?? "?").slice(0, 2).toUpperCase()}
        </Link>
      </div>
      <div className="bg-gradient-to-br from-orange to-orange-dark px-4 py-6 text-white">
        <div className="mb-1 text-sm opacity-85">Good morning, {firstName} 👋</div>
        <h2 className="mb-4 text-xl font-bold">Ready to commute?</h2>
        <button
          onClick={() => router.push("/find")}
          className="flex w-full items-center gap-2 rounded-xl bg-white/15 px-3.5 py-3 text-left text-sm"
        >
          <IconMap2 size={20} />
          <span className="flex-1 opacity-90">Search a route…</span>
          <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-orange">
            Search
          </span>
        </button>
      </div>

      <div className="p-4">
        <div className="mb-4 grid grid-cols-4 gap-2">
          <Link
            href={current ? `/trip/${current.booking.id}/live` : "/find"}
            className="flex flex-col items-center gap-1 rounded-xl bg-surface p-3 text-center"
          >
            <IconMap2 size={22} className="text-orange" />
            <span className="text-[11px] font-medium text-muted">Live ride</span>
          </Link>
          <Link
            href="/rider/saved-routes"
            className="flex flex-col items-center gap-1 rounded-xl bg-surface p-3 text-center"
          >
            <IconHeart size={22} className="text-orange" />
            <span className="text-[11px] font-medium text-muted">Saved</span>
          </Link>
          <Link
            href="/leaderboard"
            className="flex flex-col items-center gap-1 rounded-xl bg-surface p-3 text-center"
          >
            <IconTrophy size={22} className="text-orange" />
            <span className="text-[11px] font-medium text-muted">Rankings</span>
          </Link>
          <Link
            href="/safety"
            className="flex flex-col items-center gap-1 rounded-xl bg-surface p-3 text-center"
          >
            <IconShield size={22} className="text-green" />
            <span className="text-[11px] font-medium text-muted">Safety</span>
          </Link>
        </div>

        <h3 className="mb-2 text-sm font-bold">Upcoming ride</h3>
        {current && current.route ? (
          <div className="mb-5 rounded-xl bg-gradient-to-br from-green to-green-dark p-4 text-white">
            <div className="mb-1 text-base font-bold">
              {current.route.from} → {current.route.to}
            </div>
            <div className="mb-3 text-xs opacity-85">
              Today · {current.route.departureTime} · {current.driver?.name}
            </div>
            <div className="mb-3 text-xs opacity-90">
              {current.seatsFilled} seat{current.seatsFilled !== 1 && "s"} filled
            </div>
            <div className="flex gap-2">
              <Link
                href={`/trip/${current.booking.id}/chat`}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/20 py-2 text-xs font-semibold"
              >
                <IconMessageCircle size={14} /> Group chat
              </Link>
              {current.driver?.phone ? (
                <a
                  href={`tel:${current.driver.phone}`}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/20 py-2 text-xs font-semibold"
                >
                  <IconPhone size={14} /> Call driver
                </a>
              ) : (
                <span className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/10 py-2 text-xs font-semibold opacity-60">
                  <IconPhone size={14} /> No number
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="mb-5 rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted">
            No upcoming ride —{" "}
            <Link href="/find" className="font-semibold text-orange">
              find one
            </Link>
          </div>
        )}

        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold">Ride history</h3>
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-muted">No completed rides yet.</p>
        ) : (
          history.map((t) => (
            <div key={t.id} className="flex items-center gap-3 py-2.5">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-light text-green">
                <IconCheck size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{t.route}</div>
                <div className="text-xs text-muted">
                  {t.dateLabel} · {t.driverName}
                </div>
              </div>
              <div className="text-sm font-bold">₦{t.fare}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function RiderHomePage() {
  return (
    <RequireAuth>
      <HomeContent />
    </RequireAuth>
  );
}
