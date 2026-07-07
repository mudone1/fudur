"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { authFetch } from "@/lib/authFetch";
import RequireAuth from "@/components/auth/RequireAuth";
import TopNav from "@/components/layout/TopNav";
import { IconHeartFilled, IconX } from "@tabler/icons-react";

interface FavouriteDriverItem {
  id: string;
  driverUid: string;
  name: string;
  rating: number;
  trips: number;
  activeRoute: { id: string; from: string; to: string; departureTime: string } | null;
}

function FavouritesContent() {
  const { firebaseUser } = useAuth();
  const router = useRouter();
  const [favourites, setFavourites] = useState<FavouriteDriverItem[] | null>(null);

  async function load() {
    const res = await authFetch(firebaseUser, "/api/favourites/drivers");
    if (res.ok) setFavourites((await res.json()).favourites ?? []);
  }

  useEffect(() => {
    if (firebaseUser) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser]);

  async function removeFavourite(driverUid: string) {
    await authFetch(firebaseUser, `/api/favourites/drivers/${driverUid}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <TopNav title="Favourite drivers" />
      <div className="flex flex-col gap-2.5 p-4">
        {favourites === null ? (
          <p className="text-center text-sm text-muted">Loading…</p>
        ) : favourites.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
            No favourite drivers yet — tap the heart on a driver&apos;s profile
            after a ride you enjoyed.
          </div>
        ) : (
          favourites.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-3 rounded-xl border border-border p-3.5"
            >
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-orange-light text-sm font-bold text-orange">
                {f.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold">{f.name}</div>
                <div className="text-xs text-muted">
                  ★ {f.rating.toFixed(1)} · {f.trips} trips
                </div>
                {f.activeRoute && (
                  <div className="mt-0.5 text-xs text-green">
                    Active: {f.activeRoute.from} → {f.activeRoute.to} ·{" "}
                    {f.activeRoute.departureTime}
                  </div>
                )}
              </div>
              {f.activeRoute ? (
                <button
                  onClick={() => router.push(`/ride/${f.activeRoute!.id}`)}
                  className="rounded-lg bg-orange px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Book
                </button>
              ) : (
                <span className="text-xs text-muted">No active route</span>
              )}
              <button onClick={() => removeFavourite(f.driverUid)} className="text-muted">
                <IconX size={16} />
              </button>
            </div>
          ))
        )}

        <div className="notice-box notice-orange mt-1">
          <IconHeartFilled size={14} className="mr-1 inline text-orange" />
          Favouriting a driver makes it quick to book with them again — it
          doesn&apos;t reserve a seat automatically.
        </div>
      </div>
    </div>
  );
}

export default function FavouriteDriversPage() {
  return (
    <RequireAuth>
      <FavouritesContent />
    </RequireAuth>
  );
}
