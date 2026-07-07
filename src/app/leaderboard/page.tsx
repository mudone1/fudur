"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authFetch } from "@/lib/authFetch";
import RequireAuth from "@/components/auth/RequireAuth";
import TopNav from "@/components/layout/TopNav";
import clsx from "@/lib/clsx";
import { IconTrophy } from "@tabler/icons-react";
import type { LeaderboardEntry } from "@/types";

const MEDALS = ["🥇", "🥈", "🥉"];

function LeaderboardContent() {
  const { firebaseUser, profile } = useAuth();
  const [type, setType] = useState<"driver" | "rider">(
    profile?.type === "rider" ? "rider" : "driver"
  );
  const [top, setTop] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [myTrips, setMyTrips] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await authFetch(firebaseUser, `/api/leaderboard?type=${type}`);
      if (res.ok) {
        const data = await res.json();
        setTop(data.top ?? []);
        setMyRank(data.myRank ?? null);
        setMyTrips(data.myTrips ?? null);
      }
      setLoading(false);
    }
    if (firebaseUser) load();
  }, [firebaseUser, type]);

  return (
    <div>
      <TopNav title="Rankings" />
      <div className="flex gap-2 border-b border-border px-4 py-3">
        {(["driver", "rider"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={clsx(
              "flex-1 rounded-full py-2 text-sm font-medium",
              type === t ? "bg-orange text-white" : "bg-surface text-muted"
            )}
          >
            {t === "driver" ? "Top drivers" : "Top riders"}
          </button>
        ))}
      </div>

      <div className="p-4">
        {loading ? (
          <p className="text-center text-sm text-muted">Loading…</p>
        ) : top.length === 0 ? (
          <p className="text-center text-sm text-muted">No rankings yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {top.map((entry, i) => (
              <div
                key={entry.uid}
                className={clsx(
                  "flex items-center gap-3 rounded-xl border p-3",
                  entry.uid === firebaseUser?.uid
                    ? "border-orange bg-orange-light"
                    : "border-border"
                )}
              >
                <div className="flex w-7 flex-shrink-0 items-center justify-center text-base font-bold">
                  {MEDALS[i] ?? i + 1}
                </div>
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-green-light text-xs font-bold text-green">
                  {entry.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{entry.name}</div>
                  <div className="text-xs text-muted">★ {entry.rating.toFixed(1)}</div>
                </div>
                <div className="text-sm font-bold">{entry.trips} trips</div>
              </div>
            ))}
          </div>
        )}

        {myRank && myRank > top.length && (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-orange bg-orange-light p-3">
            <IconTrophy size={20} className="flex-shrink-0 text-orange" />
            <div className="flex-1 text-sm font-semibold">
              You&apos;re ranked #{myRank}
            </div>
            <div className="text-sm font-bold">{myTrips} trips</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <RequireAuth>
      <LeaderboardContent />
    </RequireAuth>
  );
}
