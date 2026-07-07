"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { authFetch } from "@/lib/authFetch";
import RequireAuth from "@/components/auth/RequireAuth";
import TopNav from "@/components/layout/TopNav";
import clsx from "@/lib/clsx";
import { IconArrowsExchange, IconClock } from "@tabler/icons-react";

const AREAS = ["Dutse", "Gwarimpa", "Kubwa", "Karu", "Lugbe", "Nyanya", "Life Camp"];
const DESTINATIONS = ["Federal Secretariat", "Wuse", "Area 1", "Katampe", "CBD", "Garki", "Maitama"];
const FILTERS = ["All", "Top rated", "Seats left", "Cheapest"] as const;

interface RideResult {
  id: string;
  from: string;
  to: string;
  departureTime: string;
  meetingPoint: string;
  pricePerSeat: number;
  seats: number;
  seatsLeft: number;
  driverName: string;
  driverRating: number;
  driverTrips: number;
  car?: { make: string; model: string; plate: string; colour: string };
}

function FindContent() {
  const { firebaseUser } = useAuth();
  const router = useRouter();
  const [from, setFrom] = useState(AREAS[0]);
  const [to, setTo] = useState(DESTINATIONS[0]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [results, setResults] = useState<RideResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [filtered, setFiltered] = useState(false);

  async function loadRides(withFilter: boolean) {
    setLoading(true);
    try {
      const qs = withFilter
        ? `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
        : "";
      const res = await authFetch(firebaseUser, `/api/rides/search${qs}`);
      const data = await res.json();
      setResults(data.routes ?? []);
      setFiltered(withFilter);
    } finally {
      setLoading(false);
    }
  }

  // Show every available ride the moment the page loads — searching by
  // route is there to narrow things down, not a requirement to see anything.
  useEffect(() => {
    if (firebaseUser) loadRides(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser]);

  const sorted = (() => {
    if (!results) return [];
    const copy = [...results];
    if (filter === "Top rated") copy.sort((a, b) => b.driverRating - a.driverRating);
    if (filter === "Seats left") copy.sort((a, b) => b.seatsLeft - a.seatsLeft);
    if (filter === "Cheapest") copy.sort((a, b) => a.pricePerSeat - b.pricePerSeat);
    return copy;

  })();

  return (
    <div>
      <TopNav title="Find a ride" />
      <div className="flex flex-col gap-2.5 border-b border-border px-4 py-3.5">
        <div className="flex items-center gap-2">
          <select
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="flex-1 rounded-[10px] border border-border px-3 py-2.5 text-sm"
          >
            {AREAS.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
          <button
            onClick={() => {
              // areas/destinations aren't the same list, so swap is a no-op
              // beyond visual feedback in this simplified rebuild
            }}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-surface"
          >
            <IconArrowsExchange size={18} className="text-muted" />
          </button>
          <select
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="flex-1 rounded-[10px] border border-border px-3 py-2.5 text-sm"
          >
            {DESTINATIONS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <IconClock size={18} className="text-muted" />
          <input type="time" defaultValue="07:00" className="rounded-[10px] border border-border px-2.5 py-2 text-sm" />
          <div className="flex flex-1 gap-1.5 overflow-x-auto">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={clsx(
                  "flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium",
                  filter === f ? "bg-ink text-white" : "bg-surface text-muted"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => loadRides(true)}
          className="mt-1 w-full rounded-fudur bg-orange py-2.5 text-sm font-semibold text-white"
        >
          {loading ? "Searching…" : "Search this route"}
        </button>
      </div>

      <div className="flex flex-col gap-3 p-4">
        {loading && results === null ? (
          <p className="text-center text-sm text-muted">Loading rides…</p>
        ) : sorted.length === 0 ? (
          <p className="text-center text-sm text-muted">
            {filtered
              ? "No rides found for that route yet"
              : "No rides available right now — check back soon"}
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-[13px] text-muted">
                {filtered
                  ? `Showing ${sorted.length} ride${sorted.length !== 1 ? "s" : ""} for this route`
                  : `Showing all ${sorted.length} available ride${sorted.length !== 1 ? "s" : ""}`}
              </p>
              {filtered && (
                <button
                  onClick={() => loadRides(false)}
                  className="text-[13px] font-semibold text-orange"
                >
                  Show all
                </button>
              )}
            </div>
            {sorted.map((ride) => (
              <button
                key={ride.id}
                onClick={() => router.push(`/ride/${ride.id}`)}
                className="rounded-xl border border-border p-3.5 text-left"
              >
                <div className="mb-2.5 flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-orange-light text-sm font-bold text-orange">
                    {ride.driverName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">
                      {ride.driverName}
                    </div>
                    <div className="text-xs text-muted">
                      ★ {ride.driverRating.toFixed(1)} · {ride.driverTrips} trips
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-orange">
                      ₦{ride.pricePerSeat}
                    </div>
                    <div className="text-[11px] text-muted">per seat</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-muted">Departs</div>
                    <div className="font-medium">{ride.departureTime}</div>
                  </div>
                  <div>
                    <div className="text-muted">Meeting point</div>
                    <div className="font-medium">{ride.meetingPoint}</div>
                  </div>
                  {ride.car && (
                    <>
                      <div>
                        <div className="text-muted">Car</div>
                        <div className="font-medium">
                          {ride.car.colour} {ride.car.make} {ride.car.model}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted">Plate</div>
                        <div className="font-mono font-medium">{ride.car.plate}</div>
                      </div>
                    </>
                  )}
                </div>
                <div className="mt-2.5 flex items-center justify-between border-t border-border pt-2.5">
                  <span className="text-xs text-muted">
                    {ride.seatsLeft} seat{ride.seatsLeft !== 1 && "s"} left
                  </span>
                  <span className="text-xs font-semibold text-orange">Book →</span>
                </div>
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export default function FindRidePage() {
  return (
    <RequireAuth>
      <FindContent />
    </RequireAuth>
  );
}
