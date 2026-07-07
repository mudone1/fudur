"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { authFetch } from "@/lib/authFetch";
import RequireAuth from "@/components/auth/RequireAuth";
import TopNav from "@/components/layout/TopNav";
import Button from "@/components/ui/Button";
import type { DriverRoute } from "@/types";

interface RideDetail {
  route: DriverRoute;
  driver: { name: string; rating: number; trips: number } | null;
  passengers: { bookingId: string; uid: string; name: string; rating: number }[];
  seatsLeft: number;
}

function BookingContent() {
  const { firebaseUser } = useAuth();
  const router = useRouter();
  const params = useParams<{ routeId: string }>();
  const [detail, setDetail] = useState<RideDetail | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await authFetch(firebaseUser, `/api/rides/${params.routeId}`);
      if (res.ok) setDetail(await res.json());
    }
    load();
  }, [firebaseUser, params.routeId]);

  async function confirm() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await authFetch(firebaseUser, "/api/bookings", {
        method: "POST",
        body: JSON.stringify({ routeId: params.routeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");
      router.push(`/trip/${data.bookingId}/chat`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (!detail) {
    return (
      <div>
        <TopNav title="Confirm booking" />
        <p className="p-6 text-center text-sm text-muted">Loading…</p>
      </div>
    );
  }

  const { route, driver, passengers } = detail;

  return (
    <div className="pb-24">
      <TopNav title="Confirm booking" />
      <div className="p-4">
        <h3 className="mb-2.5 text-sm font-bold">Trip details</h3>
        <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-muted">From</div>
            <div className="font-medium">{route.from}</div>
          </div>
          <div>
            <div className="text-xs text-muted">To</div>
            <div className="font-medium">{route.to}</div>
          </div>
          <div>
            <div className="text-xs text-muted">Departs</div>
            <div className="font-medium">{route.departureTime} today</div>
          </div>
          <div>
            <div className="text-xs text-muted">Fare</div>
            <div className="font-bold text-orange">₦{route.pricePerSeat}</div>
          </div>
          <div className="col-span-2">
            <div className="text-xs text-muted">Meeting point</div>
            <div className="font-medium">{route.meetingPoint}</div>
          </div>
        </div>

        <div className="my-4 border-t border-border pt-4">
          <h3 className="mb-2.5 text-sm font-bold">Your driver</h3>
          <div className="flex items-center gap-3 rounded-xl border border-border p-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-orange-light text-sm font-bold text-orange">
              {(driver?.name ?? "??").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold">{driver?.name}</div>
              <div className="text-xs text-muted">
                ★ {(driver?.rating ?? 5).toFixed(1)} · {driver?.trips ?? 0} trips
              </div>
            </div>
            {route.car && (
              <div className="text-right">
                <div className="font-mono text-xs">{route.car.plate}</div>
                <div className="text-[11px] text-muted">
                  {route.car.colour} {route.car.model}
                </div>
              </div>
            )}
          </div>
        </div>

        {passengers.length > 0 && (
          <div className="my-4 border-t border-border pt-4">
            <h3 className="mb-2.5 text-sm font-bold">Fellow passengers</h3>
            <div className="flex flex-col gap-2">
              {passengers.map((p) => (
                <div
                  key={p.bookingId}
                  className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-light text-xs font-bold text-green">
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="flex-1 text-sm">{p.name}</span>
                  <span className="text-xs text-muted">★ {p.rating.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="my-4 flex flex-col gap-2.5 border-t border-border pt-4">
          <div className="notice-box notice-green">
            <strong>Group chat unlocked!</strong> After booking you&apos;ll be
            added to the shared chat with your co-riders and driver.
          </div>
          <div className="notice-box notice-orange">
            <strong>Payment:</strong> Pay your driver directly — ₦
            {route.pricePerSeat} cash or transfer when you get in. Fudur
            doesn&apos;t handle payments.
          </div>
        </div>

        {error && (
          <div className="mb-3 rounded-[10px] border border-[#E24B4A] bg-[#FFF0F0] px-3.5 py-3 text-sm text-[#C83030]">
            {error}
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 mx-auto flex max-w-app items-center justify-between gap-3 border-t border-border bg-white px-4 py-3.5">
        <div>
          <div className="text-lg font-bold">₦{route.pricePerSeat}</div>
          <div className="text-[11px] text-muted">cash to driver</div>
        </div>
        <Button
          variant="orange"
          className="flex-1"
          loading={submitting}
          onClick={confirm}
        >
          Confirm booking
        </Button>
      </div>
    </div>
  );
}

export default function BookingConfirmPage() {
  return (
    <RequireAuth>
      <BookingContent />
    </RequireAuth>
  );
}
