"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { IconMapPin, IconPhone, IconShieldCheck } from "@tabler/icons-react";

interface SharedTrip {
  status: string;
  tripDate: string;
  riderName: string;
  route: { from: string; to: string; departureTime: string; meetingPoint: string } | null;
  driver: { name: string; phone: string | null; rating: number } | null;
  car: { make: string; model: string; plate: string; colour: string } | null;
}

export default function SharedTripPage() {
  const params = useParams<{ bookingId: string }>();
  const [trip, setTrip] = useState<SharedTrip | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/share/${params.bookingId}`);
      if (!res.ok) {
        setNotFound(true);
        return;
      }
      setTrip(await res.json());
    }
    load();
  }, [params.bookingId]);

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-lg font-bold">Trip link not found</p>
        <p className="text-sm text-muted">
          This link may have expired or the trip no longer exists.
        </p>
      </div>
    );
  }

  if (!trip) {
    return <p className="p-10 text-center text-sm text-muted">Loading trip…</p>;
  }

  return (
    <div className="min-h-screen bg-surface pb-10">
      <div className="bg-gradient-to-br from-orange to-orange-dark px-4 py-6 text-center text-white">
        <div className="mb-1 flex items-center justify-center gap-1.5 text-xs opacity-85">
          <IconShieldCheck size={14} /> Shared for safety by {trip.riderName}
        </div>
        <h1 className="text-lg font-bold">
          {trip.route?.from} → {trip.route?.to}
        </h1>
        <p className="text-sm opacity-85">
          {trip.status === "completed" ? "Trip completed" : "Trip in progress"}
        </p>
      </div>

      <div className="mx-4 mt-4 rounded-xl bg-white p-4">
        <h3 className="mb-3 text-sm font-bold">Driver</h3>
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-light text-sm font-bold text-orange">
            {(trip.driver?.name ?? "??").slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold">{trip.driver?.name}</div>
            <div className="text-xs text-muted">★ {(trip.driver?.rating ?? 5).toFixed(1)}</div>
          </div>
          {trip.driver?.phone && (
            <a
              href={`tel:${trip.driver.phone}`}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-green-light text-green"
            >
              <IconPhone size={16} />
            </a>
          )}
        </div>
        {trip.car && (
          <div className="flex items-center justify-between rounded-lg bg-surface px-3 py-2 text-sm">
            <span>
              {trip.car.colour} {trip.car.make} {trip.car.model}
            </span>
            <span className="font-mono font-semibold">{trip.car.plate}</span>
          </div>
        )}
      </div>

      <div className="mx-4 mt-3 rounded-xl bg-white p-4">
        <h3 className="mb-2 text-sm font-bold">Trip details</h3>
        <div className="flex items-start gap-2 text-sm">
          <IconMapPin size={16} className="mt-0.5 flex-shrink-0 text-muted" />
          <div>
            <div>{trip.route?.meetingPoint}</div>
            <div className="text-xs text-muted">Departure: {trip.route?.departureTime}</div>
          </div>
        </div>
      </div>

      <p className="mt-6 px-4 text-center text-xs text-muted">
        This is a read-only trip-status link from Fudur, Abuja&apos;s commuter
        rideshare app. It doesn&apos;t require an account to view.
      </p>
    </div>
  );
}
