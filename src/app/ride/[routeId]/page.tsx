"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { authFetch } from "@/lib/authFetch";
import RequireAuth from "@/components/auth/RequireAuth";
import TopNav from "@/components/layout/TopNav";
import Button from "@/components/ui/Button";
import { IconShieldCheck } from "@tabler/icons-react";
import type { DriverRoute } from "@/types";

interface RideDetail {
  route: DriverRoute;
  driver: { name: string; rating: number; trips: number } | null;
  passengers: { bookingId: string; uid: string; name: string; rating: number }[];
  seatsLeft: number;
}

function DetailContent() {
  const { firebaseUser } = useAuth();
  const router = useRouter();
  const params = useParams<{ routeId: string }>();
  const [detail, setDetail] = useState<RideDetail | null>(null);

  useEffect(() => {
    async function load() {
      const res = await authFetch(firebaseUser, `/api/rides/${params.routeId}`);
      if (res.ok) setDetail(await res.json());
    }
    load();
  }, [firebaseUser, params.routeId]);

  if (!detail) {
    return (
      <div>
        <TopNav title="Driver profile" />
        <p className="p-6 text-center text-sm text-muted">Loading…</p>
      </div>
    );
  }

  const { route, driver, passengers, seatsLeft } = detail;
  const initials = (driver?.name ?? "??").slice(0, 2).toUpperCase();

  return (
    <div className="pb-24">
      <TopNav title="Driver profile" />
      <div className="flex flex-col items-center gap-1 border-b border-border py-6 text-center">
        <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-orange-light text-xl font-bold text-orange">
          {initials}
        </div>
        <div className="text-lg font-bold">{driver?.name ?? "Driver"}</div>
        <div className="text-sm text-muted">
          ★ {(driver?.rating ?? 5).toFixed(1)} · {driver?.trips ?? 0} trips completed
        </div>
        <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-green-light px-2.5 py-1 text-[11px] font-semibold text-green">
          <IconShieldCheck size={12} /> Verified
        </span>
      </div>

      <div className="p-4">
        {route.car && (
          <div className="mb-4 rounded-xl border border-border p-4">
            <h4 className="mb-2 text-sm font-bold">Car details</h4>
            <div className="flex items-center justify-between">
              <div className="font-mono text-sm">{route.car.plate}</div>
              <div className="text-sm">{route.car.colour}</div>
            </div>
            <div className="mt-2 text-sm text-muted">
              {route.car.make} {route.car.model} {route.car.year ? `· ${route.car.year}` : ""}
            </div>
            <div className="text-sm text-muted">{route.seats} passenger seats</div>
          </div>
        )}

        <div className="mb-4 rounded-xl bg-surface p-4">
          <h4 className="mb-2.5 text-xs font-bold uppercase tracking-wide text-muted">
            Today&apos;s ride
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-muted">Route</div>
              <div className="font-medium">
                {route.from} → {route.to}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted">Departure</div>
              <div className="font-medium">{route.departureTime}</div>
            </div>
            <div>
              <div className="text-xs text-muted">Meeting point</div>
              <div className="font-medium">{route.meetingPoint}</div>
            </div>
            <div>
              <div className="text-xs text-muted">Seats left</div>
              <div className="font-bold text-orange">
                {seatsLeft} of {route.seats}
              </div>
            </div>
          </div>
          {passengers.length > 0 && (
            <div className="mt-3">
              <div className="mb-1.5 text-xs text-muted">Current passengers</div>
              <div className="flex flex-wrap gap-1.5">
                {passengers.map((p) => (
                  <span
                    key={p.bookingId}
                    className="rounded-full bg-white px-2.5 py-1 text-xs"
                  >
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 mx-auto flex max-w-app items-center justify-between gap-3 border-t border-border bg-white px-4 py-3.5">
        <div>
          <div className="text-lg font-bold text-orange">
            ₦{route.pricePerSeat}
          </div>
          <div className="text-[11px] text-muted">per seat · today</div>
        </div>
        <Button
          variant="orange"
          className="flex-1"
          disabled={seatsLeft <= 0}
          onClick={() => router.push(`/ride/${params.routeId}/book`)}
        >
          {seatsLeft <= 0 ? "Fully booked" : "Book this seat"}
        </Button>
      </div>
    </div>
  );
}

export default function DriverDetailPage() {
  return (
    <RequireAuth>
      <DetailContent />
    </RequireAuth>
  );
}
